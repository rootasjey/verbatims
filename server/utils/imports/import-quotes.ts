import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { uploadBackupFile } from '~/server/utils/backup-storage'
import { createBackupFile } from '~/server/utils/backup-database'
import { findOrCreateAuthor, findOrCreateReference } from '~/server/utils/import-helpers'
import { validateQuoteDataZod } from '~/server/utils/validation/quote'

export async function importQuotesInline(
  parentImportId: string,
  quotes: any[],
  options: ImportOptions,
  fallbackUserId: number
) {
  const db = hubDatabase()
  if (!db) throw new Error('Database not available')

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
        const row = await db.prepare('SELECT id FROM import_logs WHERE import_id = ? LIMIT 1').bind(parentImportId).first()
        importLogId = Number(row?.id) ?? undefined
      } catch {}

      await createBackupFile(db, {
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

  const insert = db.prepare(`
    INSERT INTO quotes (
      name, language, author_id, reference_id, user_id, status, moderator_id, moderated_at,
      rejection_reason, views_count, likes_count, shares_count, is_featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batchSize = options.batchSize || 25
  const subSize = 10

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
          const res = await findOrCreateAuthor(db, { name: String(q.author_name) })
          authorId = res.id
        }
        // Resolve reference_id
        let referenceId = q.reference_id as number | undefined
        if (!referenceId && q.reference_name) {
          const res = await findOrCreateReference(db, { name: String(q.reference_name) })
          referenceId = res.id
        }
        // Resolve user_id
        let userId = q.user_id as number | undefined
        if (!userId && q.user_email) {
          const row = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(String(q.user_email)).first()
          if (row?.id) userId = Number(row.id)
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
          const existing = await db.prepare('SELECT id, author_id, reference_id FROM quotes WHERE name = ? AND language = ? LIMIT 1')
            .bind(q.name, lang)
            .first()
          if (existing?.id) {
            const ea = existing.author_id != null ? Number(existing.author_id) : null
            const er = existing.reference_id != null ? Number(existing.reference_id) : null
            const ca = authorId ?? null
            const cr = referenceId ?? null
            if (ea === ca && er === cr) matchedId = Number(existing.id)
          }
        }

        if (matchedId && quotePolicy === 'ignore') {
          skipped++
          continue
        }

        if (matchedId && quotePolicy === 'upsert') {
          const sets: string[] = []
          const binds: any[] = []

          const addField = (column: string, value: any, allowed: boolean) => {
            if (!allowed) return
            if (quoteStrategy === 'overwrite') {
              sets.push(`${column} = ?`)
              binds.push(value)
            } else {
              sets.push(`${column} = COALESCE(?, ${column})`)
              binds.push(value)
            }
          }

          addField('name', q.name, allowedFields.has('name'))
          addField('status', status, allowedFields.has('status'))
          addField('is_featured', isFeatured ? 1 : 0, allowedFields.has('is_featured'))
          addField('rejection_reason', q.rejection_reason || null, allowedFields.has('rejection_reason'))
          addField('moderator_id', q.moderator_id || null, allowedFields.has('moderator_id'))
          addField('moderated_at', q.moderated_at || null, allowedFields.has('moderated_at'))

          // Only proceed if there is something to update
          if (sets.length > 0) {
            sets.push('updated_at = CURRENT_TIMESTAMP')
            const sql = `UPDATE quotes SET ${sets.join(', ')} WHERE id = ?`
            binds.push(matchedId)
            stmts.push(db.prepare(sql).bind(...binds))
          }
          continue
        }

        // Default: insert
        stmts.push(insert.bind(
          q.name,
          lang,
          authorId || null,
          referenceId || null,
          userId,
          status,
          q.moderator_id || null,
          q.moderated_at || null,
          q.rejection_reason || null,
          views,
          likes,
          shares,
          isFeatured ? 1 : 0,
          q.created_at || new Date().toISOString(),
          q.updated_at || new Date().toISOString(),
        ))
      }

      if (skipped > 0) {
        const p0 = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          processedRecords: Math.min(p0.processedRecords + skipped, p0.totalRecords),
          warnings: [...p0.warnings, `Skipped ${skipped} duplicate quotes (policy: ${quotePolicy}).`]
        })
      }

      try {
        await db.batch(stmts)
        const p = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          successfulRecords: p.successfulRecords + stmts.length,
          processedRecords: Math.min((p.processedRecords + stmts.length), p.totalRecords)
        })
      } catch (e: any) {
        for (let idx = 0; idx < stmts.length; idx++) {
          try {
            await stmts[idx].run()
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
          }
        }
      }

      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
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

    const db = hubDatabase()
    if (!db) throw new Error('Database not available')

    await importQuotesInline(importId, quotes, options, userId)

    // Persist completion
    try {
      const db2 = hubDatabase()
      const pp = getAdminImport(importId)!
      await db2.prepare(`UPDATE import_logs SET status=?, record_count=?, successful_count=?, failed_count=?, warnings_count=?, completed_at=CURRENT_TIMESTAMP WHERE import_id=?`)
        .bind('completed', pp.totalRecords, pp.successfulRecords, pp.failedRecords, pp.warnings.length, importId).run()
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
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, idx) => {
      const v = values[idx] ?? null
      if (['views_count','likes_count','shares_count','author_id','reference_id','user_id','moderator_id'].includes(h)) {
        obj[h] = v && v !== '' ? Number(v) : null
      } else if (h === 'is_featured') {
        obj[h] = String(v).toLowerCase() === 'true'
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
    const obj: any = {}
    let fm: RegExpExecArray | null
    while ((fm = fieldRegex.exec(m[1]))) {
      if (fm[1] !== fm[3]) continue
      obj[fm[1]] = fm[2]
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
