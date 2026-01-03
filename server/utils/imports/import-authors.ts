import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { uploadBackupFile } from '~/server/utils/backup-storage'
import { createBackupFile } from '~/server/utils/backup-database'
import { validateAuthorDataZod } from '~/server/utils/validation/author'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export async function importAuthorsInline(parentImportId: string, authors: any[], options: ImportOptions) {
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
      const up = await uploadBackupFile(json, `import_${parentImportId}_authors.json`, 'authors', 'json')

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
        filename: `import_${parentImportId}_authors.json`,
        file_path: up.filePath,
        file_size: up.fileSize,
        compressed_size: up.compressedSize,
        content_hash: up.contentHash,
        compression_type: up.compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'authors', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for authors (${up.filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (authors): ${e.message}`] })
    }
  }

  const authorPolicy = options.conflict?.authors?.mode || 'ignore'
  const authorStrategy = options.conflict?.authors?.updateStrategy || 'fill-missing'

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
            const row = await db.select({ id: schema.authors.id, name: schema.authors.name })
              .from(schema.authors)
              .where(sql`lower(${schema.authors.name}) = ${k}`)
              .limit(1)
              .get()
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
          const updateData: any = {}
          const addFieldFill = (key: keyof typeof schema.authors, value: any) => {
             if (authorStrategy === 'overwrite') {
               updateData[key] = value
             } else {
               updateData[key] = sql`COALESCE(${schema.authors[key]}, ${value})`
             }
          }
          
          addFieldFill('isFictional', Boolean(author.is_fictional) || false)
          addFieldFill('birthDate', author.birth_date || null)
          addFieldFill('birthLocation', author.birth_location || null)
          addFieldFill('deathDate', author.death_date || null)
          addFieldFill('deathLocation', author.death_location || null)
          addFieldFill('job', author.job || null)
          addFieldFill('description', author.description || null)
          addFieldFill('imageUrl', author.image_url || null)
          addFieldFill('socials', socialsField)
          addFieldFill('viewsCount', author.views_count || 0)
          addFieldFill('likesCount', author.likes_count || 0)
          addFieldFill('sharesCount', author.shares_count || 0)
          
          updateData.updatedAt = new Date()
          
          stmts.push(db.update(schema.authors).set(updateData).where(eq(schema.authors.id, match.id)))
          continue
        }

        // Default: insert; optionally preserve explicit id
        const explicitId = options.preserveIds && Number.isFinite(Number(author.id)) ? Number(author.id) : undefined
        const values = {
            id: explicitId,
            name: author.name,
            isFictional: Boolean(author.is_fictional) || false,
            birthDate: author.birth_date || null,
            birthLocation: author.birth_location || null,
            deathDate: author.death_date || null,
            deathLocation: author.death_location || null,
            job: author.job || null,
            description: author.description || null,
            imageUrl: author.image_url || null,
            socials: socialsField,
            viewsCount: author.views_count || 0,
            likesCount: author.likes_count || 0,
            sharesCount: author.shares_count || 0,
            createdAt: author.created_at ? new Date(author.created_at) : new Date(),
            updatedAt: author.updated_at ? new Date(author.updated_at) : new Date(),
        }
        stmts.push(db.insert(schema.authors).values(values))
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
      const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.authors).get()
      const maxId = Number(row?.mx || 0)
      if (maxId > 0) {
        const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'authors'`)
        const changes = Number(upd?.rowsAffected || 0)
        if (changes === 0) {
          try {
            await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ${maxId})`)
          } catch {
            try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'authors'`) } catch {}
            try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ${maxId})`) } catch {}
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
    await importAuthorsInline(importId, authors, options)
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

export async function parseAuthorsCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0] ?? '')
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
    if (!m) continue
    const obj: any = {}
    let fm: RegExpExecArray | null
    const xmlBlock = String(m[1] ?? '')
    while ((fm = fieldRegex.exec(xmlBlock))) {
      if (!fm) continue
      const key = String(fm[1] ?? '')
      const val = String(fm[2] ?? '')
      if (key !== String(fm[3] ?? '')) continue
      obj[key] = val.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    }
    items.push(obj)
  }
  return items
}
