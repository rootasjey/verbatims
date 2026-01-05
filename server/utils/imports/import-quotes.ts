import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import type { ImportOptions } from '~~/server/types'

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

      const quotePolicy = options.conflict?.quotes?.mode || 'insert'
      const quoteStrategy = options.conflict?.quotes?.updateStrategy || 'fill-missing'
      const allowedFields = new Set(options.conflict?.quotes?.fields || ['status','is_featured','rejection_reason','moderator_id','moderated_at'])

      const stmts: any[] = []
      let skipped = 0

      for (const q of sub) {
        // Resolve author_id
        let authorId = q.author_id as number | undefined
        if (!authorId && q.author_name) {
          const res = await findOrCreateAuthor({ name: String(q.author_name) })
          authorId = res.id
        }
        // Resolve reference_id
        let referenceId = q.reference_id as number | undefined
        if (!referenceId && q.reference_name) {
          const res = await findOrCreateReference({ name: String(q.reference_name) })
          referenceId = res.id
        }
        // Resolve user_id
        let userId = q.user_id as number | undefined
        if (!userId && q.user_email) {
          const row = await db.select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, String(q.user_email)))
            .limit(1)
            .get()
          if (row?.id) userId = row.id
        }
        if (!userId) userId = fallbackUserId

        const lang = q.language || 'en'
        const status = q.status || 'draft'
        const isFeatured = q.is_featured ?? false
        const views = q.views_count || 0
        const likes = q.likes_count || 0
        const shares = q.shares_count || 0

        // Conflict handling
        let matchedId: number | undefined
        if (quotePolicy !== 'insert') {
          const existing = await db.select({ id: schema.quotes.id, authorId: schema.quotes.authorId, referenceId: schema.quotes.referenceId })
            .from(schema.quotes)
            .where(and(eq(schema.quotes.name, q.name), eq(schema.quotes.language, lang)))
            .limit(1)
            .get()
            
          if (existing?.id) {
            const ea = existing.authorId != null ? Number(existing.authorId) : null
            const er = existing.referenceId != null ? Number(existing.referenceId) : null
            const ca = authorId ?? null
            const cr = referenceId ?? null
            if (ea === ca && er === cr) matchedId = existing.id
          }
        }

        if (matchedId && quotePolicy === 'ignore') {
          skipped++
          continue
        }

        if (matchedId && quotePolicy === 'upsert') {
          const updateData: any = {}
          
          const addFieldFill = (key: keyof typeof schema.quotes, value: any, allowed: boolean) => {
             if (!allowed) return
             if (quoteStrategy === 'overwrite') {
               updateData[key] = value
             } else {
               // fill-missing: update only if current is null
               // col = COALESCE(col, new_val)
               updateData[key] = sql`COALESCE(${schema.quotes[key]}, ${value})`
             }
          }

          if (allowedFields.has('name')) addFieldFill('name', q.name, true)
          if (allowedFields.has('status')) addFieldFill('status', status, true)
          if (allowedFields.has('is_featured')) addFieldFill('isFeatured', isFeatured ? 1 : 0, true)
          if (allowedFields.has('rejection_reason')) addFieldFill('rejectionReason', q.rejection_reason || null, true)
          if (allowedFields.has('moderator_id')) addFieldFill('moderatorId', q.moderator_id || null, true)
          if (allowedFields.has('moderated_at')) addFieldFill('moderatedAt', q.moderated_at ? new Date(q.moderated_at) : null, true)

          if (Object.keys(updateData).length > 0) {
             updateData.updatedAt = new Date()
             stmts.push(db.update(schema.quotes).set(updateData).where(eq(schema.quotes.id, matchedId)))
          }
          continue
        }

        // Insert
        const explicitId = options.preserveIds && Number.isFinite(Number(q.id)) ? Number(q.id) : undefined
        const values = {
            id: explicitId,
            name: q.name,
            language: lang,
            authorId: authorId || null,
            referenceId: referenceId || null,
            userId: userId,
            status: status,
            moderatorId: q.moderator_id || null,
            moderatedAt: q.moderated_at ? new Date(q.moderated_at) : null,
            rejectionReason: q.rejection_reason || null,
            viewsCount: views,
            likesCount: likes,
            sharesCount: shares,
            isFeatured: isFeatured,
            createdAt: q.created_at ? new Date(q.created_at) : new Date(),
            updatedAt: q.updated_at ? new Date(q.updated_at) : new Date(),
        }
        
        stmts.push(db.insert(schema.quotes).values(values))
      }

      if (skipped > 0) {
        const p0 = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          processedRecords: Math.min(p0.processedRecords + skipped, p0.totalRecords),
          warnings: [...p0.warnings, `Skipped ${skipped} duplicate quotes (policy: ${quotePolicy}).`]
        })
      }

      try {
        if (stmts.length > 0) {
            await db.batch(stmts as any)
            const p = getAdminImport(parentImportId)!
            updateAdminImport(parentImportId, {
            successfulRecords: p.successfulRecords + stmts.length,
            processedRecords: Math.min((p.processedRecords + stmts.length), p.totalRecords)
            })
        }
      } catch (e: any) {
        for (let idx = 0; idx < stmts.length; idx++) {
          try {
            const s = stmts[idx]
            if (!s) continue
            // Drizzle query execution
            await s
            const p = getAdminImport(parentImportId)!
            updateAdminImport(parentImportId, {
              successfulRecords: p.successfulRecords + 1,
              processedRecords: Math.min((p.processedRecords + 1), p.totalRecords)
            })
          } catch (ie: any) {
            const p = getAdminImport(parentImportId)!
            updateAdminImport(parentImportId, {
              failedRecords: p.failedRecords + 1,
              processedRecords: Math.min((p.processedRecords + 1), p.totalRecords),
              errors: [...p.errors, `Failed to import quote: ${ie.message}`]
            })
            report.addFailure({ index: i + j + (idx + 1), reason: ie.message })
          }
        }
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
