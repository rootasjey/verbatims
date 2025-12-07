import type { ImportOptions } from '~/types'
import type { getAdminImport, updateAdminImport } from '~/types''~/server/utils/admin-import-progress'
import type { uploadBackupFile } from '~/types''~/server/utils/backup-storage'
import type { createBackupFile } from '~/types''~/server/utils/backup-database'
import type { validateAuthorDataZod } from '~/types''~/server/utils/validation/author'

export async function importAuthorsInline(parentImportId: string, authors: any[], options: ImportOptions) {
  const db = hubDatabase(); if (!db) throw new Error('Database not available')

  const validation = validateAuthorDataZod(authors)
  if (!validation.isValid && !options.ignoreValidationErrors) {
    throw new Error(`Authors validation failed: ${validation.errors.length} errors`)
  }
  
  if (validation.warnings.length) {
    const p = getAdminImport(parentImportId)!
    updateAdminImport(parentImportId, { warnings: [...p.warnings, ...validation.warnings] })
  }

  // Optional centralized backup via backup_files + R2
  if (options.createBackup !== false) {
    try {
      const json = JSON.stringify({ data: authors })
      const { fileKey, filePath, fileSize, compressedSize, contentHash, compressionType } =
        await uploadBackupFile(json, `import_${parentImportId}_authors.json`, 'authors', 'json')

      let importLogId: number | undefined = undefined
      try {
        const row = await db.prepare('SELECT id FROM import_logs WHERE import_id = ? LIMIT 1').bind(parentImportId).first()
        importLogId = Number(row?.id) ?? undefined
      } catch {}

      await createBackupFile(db, {
        file_key: fileKey,
        export_log_id: undefined,
        import_log_id: importLogId ?? undefined,
        filename: `import_${parentImportId}_authors.json`,
        file_path: filePath,
        file_size: fileSize,
        compressed_size: compressedSize,
        content_hash: contentHash,
        compression_type: compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'authors', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for authors (${filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (authors): ${e.message}`] })
    }
  }

  const authorPolicy = options.conflict?.authors?.mode || 'ignore'
  const authorStrategy = options.conflict?.authors?.updateStrategy || 'fill-missing'

  const insert = db.prepare(`
    INSERT INTO authors (
      name, is_fictional, birth_date, birth_location, death_date, death_location,
      job, description, image_url, socials, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  // Optional insert with explicit id when preserveIds is enabled
  const insertWithId = db.prepare(`
    INSERT INTO authors (
      id, name, is_fictional, birth_date, birth_location, death_date, death_location,
      job, description, image_url, socials, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batchSize = options.batchSize || 50
  const subSize = 10

  for (let i = 0; i < authors.length; i += batchSize) {
    const batch = authors.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)

      // Prefetch existing authors by normalized name when needed
      let existingByKey = new Map<string, { id: number, name: string }>()
      if (authorPolicy !== 'insert') {
        const keys = Array.from(new Set(sub.map(a => (String(a.name || '')).toLowerCase().trim()).filter(Boolean)))
        if (keys.length) {
          for (const k of keys) {
            const row = await db.prepare('SELECT id, name FROM authors WHERE lower(name) = ? LIMIT 1').bind(k).first()
            if (row?.id && row?.name) existingByKey.set(String(row.name).toLowerCase(), { id: Number(row.id), name: String(row.name) })
          }
        }
      }

      // Build statements according to policy
      const stmts: any[] = []
      let skipped = 0

      for (const author of sub) {
        const socialsField = author.socials
          ? (typeof author.socials === 'string' ? author.socials : JSON.stringify(author.socials))
          : '{}'
        const key = String(author.name || '').toLowerCase().trim()
        const match = key && existingByKey.get(key)

        if (match && authorPolicy === 'ignore') {
          skipped++
          continue
        }

        if (match && authorPolicy === 'upsert') {
          // Build UPDATE with strategy
          let sql = `UPDATE authors SET
            is_fictional = COALESCE(?, is_fictional),
            birth_date = COALESCE(?, birth_date),
            birth_location = COALESCE(?, birth_location),
            death_date = COALESCE(?, death_date),
            death_location = COALESCE(?, death_location),
            job = COALESCE(?, job),
            description = COALESCE(?, description),
            image_url = COALESCE(?, image_url),
            socials = COALESCE(?, socials),
            views_count = COALESCE(?, views_count),
            likes_count = COALESCE(?, likes_count),
            shares_count = COALESCE(?, shares_count),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`
          if (authorStrategy === 'overwrite') {
            sql = `UPDATE authors SET
              is_fictional = ?,
              birth_date = ?,
              birth_location = ?,
              death_date = ?,
              death_location = ?,
              job = ?,
              description = ?,
              image_url = ?,
              socials = ?,
              views_count = ?,
              likes_count = ?,
              shares_count = ?,
              updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`
          }
          const stmt = db.prepare(sql).bind(
            (author.is_fictional ?? null),
            author.birth_date || null,
            author.birth_location || null,
            author.death_date || null,
            author.death_location || null,
            author.job || null,
            author.description || null,
            author.image_url || null,
            socialsField,
            author.views_count ?? null,
            author.likes_count ?? null,
            author.shares_count ?? null,
            match.id,
          )
          stmts.push(stmt)
          continue
        }

        // Default: insert; optionally preserve explicit id
        const explicitId = options.preserveIds && Number.isFinite(Number(author.id)) ? Number(author.id) : undefined
        if (explicitId != null) {
          const stmt = insertWithId.bind(
            explicitId,
            author.name,
            Boolean(author.is_fictional) || false,
            author.birth_date || null,
            author.birth_location || null,
            author.death_date || null,
            author.death_location || null,
            author.job || null,
            author.description || null,
            author.image_url || null,
            socialsField,
            author.views_count || 0,
            author.likes_count || 0,
            author.shares_count || 0,
            author.created_at || new Date().toISOString(),
            author.updated_at || new Date().toISOString(),
          )
          stmts.push(stmt)
        } else {
          const stmt = insert.bind(
            author.name,
            Boolean(author.is_fictional) || false,
            author.birth_date || null,
            author.birth_location || null,
            author.death_date || null,
            author.death_location || null,
            author.job || null,
            author.description || null,
            author.image_url || null,
            socialsField,
            author.views_count || 0,
            author.likes_count || 0,
            author.shares_count || 0,
            author.created_at || new Date().toISOString(),
            author.updated_at || new Date().toISOString(),
          )
          stmts.push(stmt)
        }
      }

      // Account for skipped as processed
      if (skipped > 0) {
        const p0 = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          processedRecords: Math.min(p0.processedRecords + skipped, p0.totalRecords),
          warnings: [...p0.warnings, `Skipped ${skipped} duplicate authors (policy: ${authorPolicy}).`]
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
              errors: [...p.errors, `Failed to import author "${sub[idx]?.name}": ${ie.message}`]
            })
          }
        }
      }

      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // If IDs were preserved, align sqlite_sequence to MAX(id)
  if (options.preserveIds) {
    try {
      const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM authors').first()
      const maxId = Number(row?.mx || 0)
      if (maxId > 0) {
        const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'authors'`).bind(maxId).run()
        const changes = Number(upd?.meta?.changes || 0)
        if (changes === 0) {
          try {
            await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ?)`).bind(maxId).run()
          } catch {
            try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'authors'`).run() } catch {}
            try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ?)`).bind(maxId).run() } catch {}
          }
        }
      }
    } catch {}
  }
}

export async function processImportAuthors(
  importId: string,
  rawData: any,
  format: 'json' | 'csv' | 'xml',
  options: ImportOptions,
) {
  updateAdminImport(importId, { status: 'processing' })
  try {
    let authors: any[] = []
    if (Array.isArray(rawData)) authors = rawData
    else if (format === 'json') authors = Array.isArray(rawData) ? rawData : [rawData]
    else if (format === 'csv') authors = await parseAuthorsCsv(rawData)
    else if (format === 'xml') authors = minimalXmlParse(rawData, 'author')
    else throw new Error(`Unsupported format: ${format}`)

    updateAdminImport(importId, { totalRecords: authors.length })
    const db = hubDatabase()
    if (!db) throw new Error('Database not available')
    await importAuthorsInline(importId, authors, options)
    try {
      const db2 = hubDatabase()
      const pp = getAdminImport(importId)!
      await db2.prepare(`UPDATE import_logs SET status=?, record_count=?, successful_count=?, failed_count=?, warnings_count=?, completed_at=CURRENT_TIMESTAMP WHERE import_id=?`)
        .bind('completed', pp.totalRecords, pp.successfulRecords, pp.failedRecords, pp.warnings.length, importId).run()
      updateAdminImport(importId, { status: 'completed', completedAt: new Date() })
    } catch {}
  } catch (e: any) {
    const p = getAdminImport(importId)!
    updateAdminImport(importId, { status: 'failed', completedAt: new Date(), errors: [...p.errors, e.message] })
    throw e
  }
}

export async function parseAuthorsCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, idx) => {
      const v = values[idx] ?? null
      if (h === 'is_fictional') obj[h] = String(v).toLowerCase() === 'true'
      else if (['views_count','likes_count','shares_count'].includes(h)) obj[h] = v && v !== '' ? parseInt(v, 10) : 0
      else if (h === 'socials' && v && v !== '{}' && v !== '') {
        try { obj[h] = JSON.parse(v) } catch { obj[h] = v }
      } else obj[h] = v
    })
    return obj
  })
}

export function parseCSVLine(line: string): string[] {
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

export function minimalXmlParse(xml: string, itemTag: string): any[] {
  const items: any[] = []
  const itemRegex = new RegExp(`<${itemTag}>([\\s\\S]*?)<\/${itemTag}>`, 'g')
  const fieldRegex = new RegExp('<([a-zA-Z0-9_]+)>([\\s\\S]*?)<\\/([a-zA-Z0-9_]+)>', 'g')
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(xml))) {
    const obj: any = {}
    let fm: RegExpExecArray | null
    while ((fm = fieldRegex.exec(m[1]))) {
      if (fm[1] !== fm[3]) continue
      obj[fm[1]] = fm[2].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'\"').replace(/&apos;/g,"'")
    }
    items.push(obj)
  }
  return items
}
