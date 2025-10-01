import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { validateReferenceDataZod } from '~/server/utils/validation/reference'
import { uploadBackupFile } from '~/server/utils/backup-storage'
import { createBackupFile } from '~/server/utils/backup-database'

export async function importReferencesInline(parentImportId: string, references: any[], options: ImportOptions) {
  const db = hubDatabase(); if (!db) throw new Error('Database not available')

  const validation = validateReferenceDataZod(references)
  if (!validation.isValid && !options.ignoreValidationErrors) {
    throw new Error(`References validation failed: ${validation.errors.length} errors`)
  }
  
  if (validation.warnings.length) {
    const p = getAdminImport(parentImportId)!
    updateAdminImport(parentImportId, { warnings: [...p.warnings, ...validation.warnings] })
  }

  // Optional centralized backup via backup_files + R2
  if (options.createBackup !== false) {
    try {
      const json = JSON.stringify({ data: references })
      const { fileKey, filePath, fileSize, compressedSize, contentHash, compressionType } =
        await uploadBackupFile(json, `import_${parentImportId}_references.json`, 'references', 'json')

      // Lookup numeric import_log_id for linkage (best effort)
      let importLogId: number | undefined = undefined
      try {
        const row = await db.prepare('SELECT id FROM import_logs WHERE import_id = ? LIMIT 1')
        .bind(parentImportId)
        .first()

        importLogId = Number(row?.id) ?? undefined
      } catch {}

      await createBackupFile(db, {
        file_key: fileKey,
        export_log_id: undefined,
        import_log_id: importLogId ?? undefined,
        filename: `import_${parentImportId}_references.json`,
        file_path: filePath,
        file_size: fileSize,
        compressed_size: compressedSize,
        content_hash: contentHash,
        compression_type: compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'references', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for references (${filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (references): ${e.message}`] })
    }
  }

  // Insert in batches (each db.batch() call is a transaction in D1)
  const refPolicy = options.conflict?.references?.mode || 'ignore'
  const refStrategy = options.conflict?.references?.updateStrategy || 'fill-missing'

  const insert = db.prepare(`
    INSERT INTO quote_references (
      name, original_language, release_date, description, primary_type, secondary_type,
      image_url, urls, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batchSize = options.batchSize || 50
  const subSize = 10

  for (let i = 0; i < references.length; i += batchSize) {
    const batch = references.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)

      // Prefetch existing by composite key (lower(name)|primary_type)
      let existingByKey = new Map<string, { id: number, name: string, primary_type: string }>()
      if (refPolicy !== 'insert') {
        const keys = Array.from(new Set(sub.map((r) => `${String(r.name||'').toLowerCase().trim()}|${String(r.primary_type||'')}`).filter(k => k.split('|')[0])))
        for (const k of keys) {
          const [n, pt] = k.split('|')
          const row = await db.prepare('SELECT id, name, primary_type FROM quote_references WHERE lower(name) = ? AND primary_type = ? LIMIT 1').bind(n, pt).first()
          if (row?.id) existingByKey.set(k, { id: Number(row.id), name: String(row.name), primary_type: String(row.primary_type) })
        }
      }

      const stmts: any[] = []
      let skipped = 0

      for (const reference of sub) {
        let urlsField = '[]'
        if (reference.urls) {
          if (Array.isArray(reference.urls)) urlsField = JSON.stringify(reference.urls)
          else if (typeof reference.urls === 'string') urlsField = reference.urls
          else if (typeof reference.urls === 'object') urlsField = JSON.stringify(reference.urls)
        }
  const key = `${String(reference.name||'').toLowerCase().trim()}|${String(reference.primary_type||'other')}`
        const match = existingByKey.get(key)

        if (match && refPolicy === 'ignore') { skipped++; continue }

        if (match && refPolicy === 'upsert') {
          let sql = `UPDATE quote_references SET
            original_language = COALESCE(?, original_language),
            release_date = COALESCE(?, release_date),
            description = COALESCE(?, description),
            secondary_type = COALESCE(?, secondary_type),
            image_url = COALESCE(?, image_url),
            urls = COALESCE(?, urls),
            views_count = COALESCE(?, views_count),
            likes_count = COALESCE(?, likes_count),
            shares_count = COALESCE(?, shares_count),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`
          if (refStrategy === 'overwrite') {
            sql = `UPDATE quote_references SET
              original_language = ?,
              release_date = ?,
              description = ?,
              secondary_type = ?,
              image_url = ?,
              urls = ?,
              views_count = ?,
              likes_count = ?,
              shares_count = ?,
              updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`
          }
          const stmt = db.prepare(sql).bind(
            reference.original_language || 'en',
            reference.release_date || null,
            reference.description || '',
            reference.secondary_type || '',
            reference.image_url || '',
            urlsField,
            reference.views_count ?? null,
            reference.likes_count ?? null,
            reference.shares_count ?? null,
            match.id,
          )
          stmts.push(stmt)
          continue
        }

        // default insert
        stmts.push(insert.bind(
          reference.name,
          reference.original_language || 'en',
          reference.release_date || null,
          reference.description || '',
          reference.primary_type || 'other',
          reference.secondary_type || '',
          reference.image_url || '',
          urlsField,
          reference.views_count || 0,
          reference.likes_count || 0,
          reference.shares_count || 0,
          reference.created_at || new Date().toISOString(),
          reference.updated_at || new Date().toISOString(),
        ))
      }

      if (skipped > 0) {
        const p0 = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          processedRecords: Math.min(p0.processedRecords + skipped, p0.totalRecords),
          warnings: [...p0.warnings, `Skipped ${skipped} duplicate references (policy: ${refPolicy}).`]
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
              errors: [...p.errors, `Failed to import "${sub[idx]?.name}": ${ie.message}`]
            })
          }
        }
        if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
      }
    }
  }
}

export async function processImportReferences(
  importId: string,
  rawData: any,
  format: 'json' | 'csv' | 'xml' | 'firebase',
  options: ImportOptions,
) {
  updateAdminImport(importId, { status: 'processing' })

  try {
    // Parse data
    let references: any[] = []
    if (Array.isArray(rawData)) {
      references = rawData
    } else if (format === 'json') {
      references = Array.isArray(rawData) ? rawData : [rawData]
    } else if (format === 'csv') {
      references = await parseReferencesCsv(rawData)
    } else if (format === 'xml') {
      references = typeof rawData === 'string' ? minimalXmlParse(rawData, 'reference') : []
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    updateAdminImport(importId, { totalRecords: references.length })

    const db = hubDatabase()
    if (!db) throw new Error('Database not available')

    await importReferencesInline(importId, references, options)

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

export async function parseReferencesCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, idx) => {
      const v = values[idx] ?? null
      if (h === 'urls' && v && v !== '{}' && v !== '') {
        try { obj[h] = JSON.parse(String(v)) } catch { obj[h] = v }
      } else if (['views_count','likes_count','shares_count','quotes_count'].includes(h)) {
        obj[h] = v && v !== '' ? parseInt(String(v), 10) : 0
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
  const fieldRegex = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(xml))) {
    const obj: any = {}
    let fm: RegExpExecArray | null
    while ((fm = fieldRegex.exec(m[1]))) {
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
