import { db, schema } from 'hub:db'
import { eq, and, inArray, isNull, ne, sql } from 'drizzle-orm'
import type { ImportOptions } from '~~/server/types'
import { runImportedEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { buildQuoteCreationStatements, buildQuoteImportUpsertStatements, hashQuoteCreationPayload, scopeQuoteCreationRequestKey, type QuoteCreationBatchInput } from '~~/server/utils/quote-creation'

export async function importQuotesInline(
  parentImportId: string,
  quotes: any[],
  options: ImportOptions,
  fallbackUserId: number
) {
  const validation = validateQuoteDataZod(quotes)
  if (!validation.isValid && !options.ignoreValidationErrors) {
    throw new Error(`Quotes validation failed: ${validation.errors.length} errors`)
  }
  if (validation.warnings.length) {
    const p = getAdminImport(parentImportId)!
    updateAdminImport(parentImportId, { warnings: [...p.warnings, ...validation.warnings] })
  }

  // Optional centralized backup via backup_files + R2
  if (options.createBackup !== false) {
    try {
      const json = JSON.stringify({ data: quotes })
      const up = await uploadBackupFile(json, `import_${parentImportId}_quotes.json`, 'quotes', 'json')

      let importLogId: number | undefined = undefined
      try {
        const row = await db.select({ id: schema.importLogs.id })
          .from(schema.importLogs)
          .where(eq(schema.importLogs.importId, parentImportId))
          .limit(1)
          .get()
        importLogId = row?.id
      } catch {}

      await createBackupFile({
        file_key: up.fileKey,
        export_log_id: undefined,
        import_log_id: importLogId,
        filename: `import_${parentImportId}_quotes.json`,
        file_path: up.filePath,
        file_size: up.fileSize,
        compressed_size: up.compressedSize,
        content_hash: up.contentHash,
        compression_type: up.compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'quotes', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for quotes (${up.filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (quotes): ${e.message}`] })
    }
  }

  const batchSize = options.batchSize || 25
  const subSize = 10

  const report = createImportReport(parentImportId, 'quotes', 'ndjson')

  for (let i = 0; i < quotes.length; i += batchSize) {
    const batch = quotes.slice(i, i + batchSize)

    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)

      const quotePolicy = options.conflict?.quotes?.mode || (options.preserveIds ? 'insert' : 'ignore')
      const quoteStrategy = options.conflict?.quotes?.updateStrategy || 'fill-missing'
      const allowedFields = new Set(options.conflict?.quotes?.fields || ['status','is_featured','rejection_reason','moderator_id','moderated_at'])

      let skipped = 0
      let successful = 0
      let failed = 0

      for (let recordOffset = 0; recordOffset < sub.length; recordOffset++) {
        const q = sub[recordOffset]
        const recordIndex = i + j + recordOffset + 1
        try {
          const name = String(q.name ?? '').trim()
          if (!name) throw new Error('Quote text is required')
          const lang = q.language || 'en'
          let matchedQuotes: Array<{ id: number }> = []

          if (quotePolicy !== 'insert') {
            matchedQuotes = await db.select({ id: schema.quotes.id })
              .from(schema.quotes)
              .where(and(
                sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${name}))`,
                ne(schema.quotes.status, 'rejected'),
              ))
              .limit(2)
              .all()
          }

          if (matchedQuotes.length > 1) {
            skipped++
            report.addWarning(`Record ${recordIndex}: multiple active quotes share this normalized text; provenance was not merged automatically.`)
            continue
          }
          const matchedId = matchedQuotes[0]?.id

          if (matchedId && quotePolicy === 'ignore') {
            skipped++
            report.addWarning(`Record ${recordIndex}: duplicate normalized quote text skipped; incoming attribution and source were not imported.`)
            continue
          }

          const ownerId = await resolveImportedQuoteOwner(q, fallbackUserId)
          const { authorId, newAuthor } = await resolveImportedQuoteAuthor(q)
          const { referenceId, newReference } = await resolveImportedQuoteReference(q)
          const hasIncomingAttribution = authorId != null || referenceId != null || Boolean(newAuthor || newReference)
          if (!matchedId && !hasIncomingAttribution) {
            throw new Error('An author or reference is required')
          }

          const source = q.source_type || q.source_url
            ? { source_type: q.source_type || 'manual', source_url: q.source_url || null }
            : undefined
          const payloadHash = await hashQuoteCreationPayload(q)
          const requestKey = scopeQuoteCreationRequestKey(`quote-import:${parentImportId}:${recordIndex}`, fallbackUserId)

          if (matchedId && quotePolicy === 'upsert') {
            const updateData: Record<string, unknown> = {}
            const addFieldFill = (key: keyof typeof schema.quotes, value: unknown, allowed: boolean) => {
              if (!allowed) return
              updateData[key] = quoteStrategy === 'overwrite'
                ? value
                : sql`COALESCE(${schema.quotes[key]}, ${value})`
            }
            addFieldFill('name', name, allowedFields.has('name'))
            addFieldFill('status', q.status || 'draft', allowedFields.has('status'))
            addFieldFill('isFeatured', q.is_featured ?? false, allowedFields.has('is_featured'))
            addFieldFill('rejectionReason', q.rejection_reason || null, allowedFields.has('rejection_reason'))
            addFieldFill('moderatorId', q.moderator_id || null, allowedFields.has('moderator_id'))
            addFieldFill('moderatedAt', q.moderated_at ? new Date(q.moderated_at) : null, allowedFields.has('moderated_at'))
            if (Object.keys(updateData).length > 0) updateData.updatedAt = new Date()

            let existingAttributionIds: number[] = []
            if (!newAuthor && !newReference && hasIncomingAttribution) {
              const attributionConditions = [eq(schema.quoteAttributions.quoteId, matchedId)]
              attributionConditions.push(authorId == null ? isNull(schema.quoteAttributions.authorId) : eq(schema.quoteAttributions.authorId, authorId))
              attributionConditions.push(referenceId == null ? isNull(schema.quoteAttributions.referenceId) : eq(schema.quoteAttributions.referenceId, referenceId))
              const attributions = await db.select({ id: schema.quoteAttributions.id })
                .from(schema.quoteAttributions)
                .where(and(...attributionConditions))
                .orderBy(schema.quoteAttributions.id)
                .all()
              existingAttributionIds = attributions.map(attribution => attribution.id)
            }
            const existingAttributionId = existingAttributionIds[0]

            let sourceToAdd = source
            const skipAttribution = !hasIncomingAttribution
            if (sourceToAdd && (existingAttributionIds.length > 0 || skipAttribution)) {
              const sourceConditions = [
                eq(schema.quoteSources.quoteId, matchedId),
                eq(schema.quoteSources.sourceType, sourceToAdd.source_type || 'manual'),
              ]
              sourceConditions.push(existingAttributionIds.length === 0
                ? isNull(schema.quoteSources.attributionId)
                : inArray(schema.quoteSources.attributionId, existingAttributionIds))
              sourceConditions.push(sourceToAdd.source_url == null
                ? isNull(schema.quoteSources.sourceUrl)
                : eq(schema.quoteSources.sourceUrl, sourceToAdd.source_url))
              const duplicateSource = await db.select({ id: schema.quoteSources.id })
                .from(schema.quoteSources)
                .where(and(...sourceConditions))
                .limit(1)
                .get()
              if (duplicateSource) sourceToAdd = undefined
            }

            if (Object.keys(updateData).length === 0 && (existingAttributionIds.length > 0 || skipAttribution) && !sourceToAdd) {
              skipped++
              report.addWarning(`Record ${recordIndex}: matching quote already has this attribution and source; no changes applied.`)
              continue
            }

            const hasPrimaryAttribution = hasIncomingAttribution ? await db.select({ id: schema.quoteAttributions.id })
              .from(schema.quoteAttributions)
              .where(and(eq(schema.quoteAttributions.quoteId, matchedId), eq(schema.quoteAttributions.isPrimary, true)))
              .limit(1)
              .get() : undefined
            const upsertStatements = buildQuoteImportUpsertStatements({
              requestKey,
              userId: ownerId,
              payloadHash,
              quoteId: matchedId,
              updateData,
              authorId: authorId ?? null,
              referenceId: referenceId ?? null,
              newAuthor,
              newReference,
              existingAttributionId,
              attributionIsPrimary: !hasPrimaryAttribution,
              skipAttribution,
              source: sourceToAdd,
              retainIdempotencyRecord: false,
            })
            await runImportedEditorialAuditedBatch(fallbackUserId, parentImportId, upsertStatements)
            successful++
            continue
          }

          const explicitId = options.preserveIds && Number.isFinite(Number(q.id)) ? Number(q.id) : undefined
          const { statements } = buildQuoteCreationStatements({
            requestKey,
            userId: ownerId,
            payloadHash,
            quote: {
              id: explicitId,
              name,
              language: lang,
              status: q.status || 'draft',
              moderatorId: q.moderator_id || null,
              moderatedAt: q.moderated_at ? new Date(q.moderated_at) : null,
              rejectionReason: q.rejection_reason || null,
              viewsCount: q.views_count || 0,
              likesCount: q.likes_count || 0,
              sharesCount: q.shares_count || 0,
              isFeatured: q.is_featured ?? false,
              createdAt: q.created_at ? new Date(q.created_at) : new Date(),
              updatedAt: q.updated_at ? new Date(q.updated_at) : new Date(),
            },
            authorId: authorId ?? null,
            referenceId: referenceId ?? null,
            newAuthor,
            newReference,
            primaryAttribution: { status: 'unverified' },
            sources: source ? [source] : undefined,
            claimName: quotePolicy !== 'insert',
            retainIdempotencyRecord: false,
          })
          await runImportedEditorialAuditedBatch(fallbackUserId, parentImportId, statements)
          successful++
        } catch (error: any) {
          failed++
          report.addFailure({ index: recordIndex, reason: error?.message || 'Failed to import quote', item: q })
        }
      }

      if (skipped > 0 || successful > 0 || failed > 0) {
        const progress = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          successfulRecords: progress.successfulRecords + successful,
          failedRecords: progress.failedRecords + failed,
          processedRecords: Math.min(progress.processedRecords + successful + skipped + failed, progress.totalRecords),
          ...(skipped > 0 ? { warnings: [...progress.warnings, `Skipped ${skipped} quote records (policy: ${quotePolicy}).`] } : {}),
        })
      }

      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }
  // If IDs were preserved, align sqlite_sequence to MAX(id) to keep AUTOINCREMENT consistent
  if (options.preserveIds) {
    try {
      const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.quotes).get()
      const maxId = Number(row?.mx || 0)
      if (maxId > 0) {
        // Try to update; if no row exists, insert
        const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'quotes'`)
        const changes = Number(upd?.rowsAffected || 0)
        if (changes === 0) {
          try {
            await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quotes', ${maxId})`)
          } catch (insErr) {
            // Fallback: delete and reinsert
            try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'quotes'`) } catch {}
            try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quotes', ${maxId})`) } catch {}
          }
        }
      }
    } catch (seqErr) {
      // Non-fatal
    }
  }
  // finalize report if any failures/warnings and attach link into progress
  const res = await report.finalize()
  if (res) {
    const p = getAdminImport(parentImportId)!
    const link = `/api/admin/import/report/${parentImportId}`
    updateAdminImport(parentImportId, { warnings: [...p.warnings, `Report available: ${link}`] })
  }
}

async function resolveImportedQuoteOwner(quote: any, fallbackUserId: number) {
  let userId = quote.user_id as number | undefined
  if (!userId && quote.user_email) {
    const user = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, String(quote.user_email)))
      .limit(1)
      .get()
    if (user?.id) userId = user.id
  }
  return userId || fallbackUserId
}

async function resolveImportedQuoteAuthor(quote: any): Promise<{
  authorId: number | null
  newAuthor?: QuoteCreationBatchInput['newAuthor']
}> {
  if (quote.author_id) return { authorId: Number(quote.author_id) }
  const name = String(quote.author_name ?? '').trim()
  if (!name) return { authorId: null }

  const author = await db.select({ id: schema.authors.id })
    .from(schema.authors)
    .where(sql`LOWER(${schema.authors.name}) = LOWER(${name})`)
    .limit(1)
    .get()
  return author
    ? { authorId: author.id }
    : { authorId: null, newAuthor: { name } }
}

async function resolveImportedQuoteReference(quote: any): Promise<{
  referenceId: number | null
  newReference?: QuoteCreationBatchInput['newReference']
}> {
  if (quote.reference_id) return { referenceId: Number(quote.reference_id) }
  const name = String(quote.reference_name ?? '').trim()
  if (!name) return { referenceId: null }

  const reference = await db.select({ id: schema.quoteReferences.id })
    .from(schema.quoteReferences)
    .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${name})`)
    .limit(1)
    .get()
  return reference
    ? { referenceId: reference.id }
    : { referenceId: null, newReference: { name, primaryType: 'other', originalLanguage: 'en' } }
}

// High-level processing + parsers moved from API route
export async function processImportQuotes(
  importId: string,
  rawData: any,
  format: 'json' | 'csv' | 'xml',
  options: ImportOptions,
  userId: number,
) {
  updateAdminImport(importId, { status: 'processing' })

  try {
    // Parse data
    let quotes: any[] = []
    if (Array.isArray(rawData)) {
      quotes = rawData
    } else if (format === 'json') {
      quotes = Array.isArray(rawData) ? rawData : [rawData]
    } else if (format === 'csv') {
      quotes = await parseQuotesCsv(rawData)
    } else if (format === 'xml') {
      quotes = minimalXmlParse(String(rawData || ''), 'quote')
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    updateAdminImport(importId, { totalRecords: quotes.length })

    await importQuotesInline(importId, quotes, options, userId)

    // Persist completion
    try {
      const pp = getAdminImport(importId)!
      await db.update(schema.importLogs)
        .set({
            status: 'completed',
            recordCount: pp.totalRecords,
            successfulCount: pp.successfulRecords,
            failedCount: pp.failedRecords,
            warningsCount: pp.warnings.length,
            completedAt: new Date()
        })
        .where(eq(schema.importLogs.importId, importId))
      
      updateAdminImport(importId, { status: 'completed', completedAt: new Date() as any })
    } catch {}

  } catch (e: any) {
    const p = getAdminImport(importId)!
    updateAdminImport(importId, { status: 'failed', completedAt: new Date() as any, errors: [...p.errors, e.message] })
    throw e
  }
}

export async function parseQuotesCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0] ?? '')
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, idx) => {
      const v = values[idx] ?? null
      if (['views_count','likes_count','shares_count','author_id','reference_id','user_id','moderator_id'].includes(h)) {
        obj[h] = v && v !== '' ? Number(v) : null
      } else if (h === 'is_featured') {
        if (v === null || v === '') obj[h] = undefined
        else {
          const s = String(v).trim().toLowerCase()
          if (['1','true','yes','y'].includes(s)) obj[h] = true
          else if (['0','false','no','n'].includes(s)) obj[h] = false
          else obj[h] = Boolean(v)
        }
      } else {
        obj[h] = v
      }
    })
    return obj
  })
}

function parseCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i+1] === '"') { cur += '"'; i++ } else { quoted = !quoted }
    } else if (ch === ',' && !quoted) { out.push(cur.trim()); cur = '' } else { cur += ch }
  }
  out.push(cur.trim())
  return out
}

function minimalXmlParse(xml: string, itemTag: string): any[] {
  const items: any[] = []
  const itemRegex = new RegExp(`<${itemTag}>([\\s\\S]*?)<\/${itemTag}>`, 'g')
  const fieldRegex = new RegExp('<([a-zA-Z0-9_]+)>([\\s\\S]*?)<\\/([a-zA-Z0-9_]+)>', 'g')
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(xml))) {
    if (!m) continue
    const obj: any = {}
    let fm: RegExpExecArray | null
    const xmlBlock = String(m[1] ?? '')
    while ((fm = fieldRegex.exec(xmlBlock))) {
      if (!fm) continue
      const key = String(fm[1] ?? '')
      const val = String(fm[2] ?? '')
      if (key !== String(fm[3] ?? '')) continue
      obj[key] = val
        .replace(/&lt;/g,'<')
        .replace(/&gt;/g,'>')
        .replace(/&amp;/g,'&')
        .replace(/&quot;/g,'"')
        .replace(/&apos;/g,"'")
    }
    items.push(obj)
  }
  return items
}
