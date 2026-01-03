import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { uploadBackupFile } from '~/server/utils/backup-storage'
import { createBackupFile } from '~/server/utils/backup-database'
import { validateTagDataZod } from '~/server/utils/validation/tag'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export async function importTagsInline(parentImportId: string, tags: any[], options: ImportOptions) {
  const validation = validateTagDataZod(tags)
  if (!validation.isValid && !options.ignoreValidationErrors) {
    throw new Error(`Tags validation failed: ${validation.errors.length} errors`)
  }
  
  if (validation.warnings.length) {
    const p = getAdminImport(parentImportId)!
    updateAdminImport(parentImportId, { warnings: [...p.warnings, ...validation.warnings] })
  }

  // Optional centralized backup via backup_files + R2
  if (options.createBackup !== false) {
    try {
      const json = JSON.stringify({ data: tags })
      const { fileKey, filePath, fileSize, compressedSize, contentHash, compressionType } =
        await uploadBackupFile(json, `import_${parentImportId}_tags.json`, 'tags', 'json')

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
        file_key: fileKey,
        export_log_id: undefined,
        import_log_id: importLogId,
        filename: `import_${parentImportId}_tags.json`,
        file_path: filePath,
        file_size: fileSize,
        compressed_size: compressedSize,
        content_hash: contentHash,
        compression_type: compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'tags', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for tags (${filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (tags): ${e.message}`] })
    }
  }

  const tagPolicy = options.conflict?.tags?.mode || 'upsert'
  const tagStrategy = options.conflict?.tags?.updateStrategy || 'fill-missing'

  const batchSize = options.batchSize || 50
  const subSize = 10

  for (let i = 0; i < tags.length; i += batchSize) {
    const batch = tags.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)

      try {
        // Process each tag in the sub-batch
        for (const tag of sub) {
          const tagData = {
            name: tag.name,
            description: tag.description || null,
            category: tag.category || null,
            color: tag.color || '#3B82F6',
            createdAt: tag.created_at || new Date().toISOString(),
            updatedAt: tag.updated_at || new Date().toISOString(),
          }

          if (tagPolicy === 'ignore') {
            await db.insert(schema.tags)
              .values(options.preserveIds && Number.isFinite(Number(tag.id)) 
                ? { id: Number(tag.id), ...tagData }
                : tagData)
              .onConflictDoNothing()
              .run()
          } else if (tagPolicy === 'upsert') {
            if (tagStrategy === 'overwrite') {
              await db.insert(schema.tags)
                .values(tagData)
                .onConflictDoUpdate({
                  target: schema.tags.name,
                  set: {
                    description: sql`excluded.description`,
                    category: sql`excluded.category`,
                    color: sql`COALESCE(NULLIF(excluded.color, ''), ${schema.tags.color})`,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  }
                })
                .run()
            } else {
              // fill-missing / prefer-existing
              await db.insert(schema.tags)
                .values(tagData)
                .onConflictDoUpdate({
                  target: schema.tags.name,
                  set: {
                    description: sql`COALESCE(excluded.description, ${schema.tags.description})`,
                    category: sql`COALESCE(excluded.category, ${schema.tags.category})`,
                    color: sql`COALESCE(NULLIF(excluded.color, ''), ${schema.tags.color})`,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  }
                })
                .run()
            }
          } else {
            await db.insert(schema.tags)
              .values(options.preserveIds && Number.isFinite(Number(tag.id))
                ? { id: Number(tag.id), ...tagData }
                : tagData)
              .run()
          }
        }

        const p = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          successfulRecords: p.successfulRecords + sub.length,
          processedRecords: Math.min((p.processedRecords + sub.length), p.totalRecords)
        })
      } catch (e: any) {
        // Fallback to individual inserts
        for (let idx = 0; idx < sub.length; idx++) {
          try {
            const tag = sub[idx]
            const tagData = {
              name: tag.name,
              description: tag.description || null,
              category: tag.category || null,
              color: tag.color || '#3B82F6',
              createdAt: tag.created_at || new Date().toISOString(),
              updatedAt: tag.updated_at || new Date().toISOString(),
            }

            if (tagPolicy === 'ignore') {
              await db.insert(schema.tags)
                .values(options.preserveIds && Number.isFinite(Number(tag.id))
                  ? { id: Number(tag.id), ...tagData }
                  : tagData)
                .onConflictDoNothing()
                .run()
            } else if (tagPolicy === 'upsert') {
              if (tagStrategy === 'overwrite') {
                await db.insert(schema.tags)
                  .values(tagData)
                  .onConflictDoUpdate({
                    target: schema.tags.name,
                    set: {
                      description: sql`excluded.description`,
                      category: sql`excluded.category`,
                      color: sql`COALESCE(NULLIF(excluded.color, ''), ${schema.tags.color})`,
                      updatedAt: sql`CURRENT_TIMESTAMP`,
                    }
                  })
                  .run()
              } else {
                await db.insert(schema.tags)
                  .values(tagData)
                  .onConflictDoUpdate({
                    target: schema.tags.name,
                    set: {
                      description: sql`COALESCE(excluded.description, ${schema.tags.description})`,
                      category: sql`COALESCE(excluded.category, ${schema.tags.category})`,
                      color: sql`COALESCE(NULLIF(excluded.color, ''), ${schema.tags.color})`,
                      updatedAt: sql`CURRENT_TIMESTAMP`,
                    }
                  })
                  .run()
              }
            } else {
              await db.insert(schema.tags)
                .values(options.preserveIds && Number.isFinite(Number(tag.id))
                  ? { id: Number(tag.id), ...tagData }
                  : tagData)
                .run()
            }

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
              errors: [...p.errors, `Failed to import tag "${sub[idx]?.name}": ${ie.message}`]
            })
          }
        }
      }

      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // Align sqlite_sequence when IDs preserved
  if (options.preserveIds) {
    try {
      const row = await db.select({ mx: sql<number>`COALESCE(MAX(id), 0)` })
        .from(schema.tags)
        .get()
      const maxId = row?.mx || 0
      if (maxId > 0) {
        try {
          const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'tags'`)
          const changes = Number((upd as any)?.rowsAffected ?? (upd as any)?.meta?.changes ?? 0)
          if (changes === 0) {
            try { 
              await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('tags', ${maxId})`)
            } catch {
              try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'tags'`) } catch {}
              try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('tags', ${maxId})`) } catch {}
            }
          }
        } catch {}
      }
    } catch {}
  }
}

// High-level processing + parsers moved from API route
export async function processImportTags(
  importId: string,
  rawData: any,
  format: 'json' | 'csv' | 'xml',
  options: ImportOptions,
) {
  updateAdminImport(importId, { status: 'processing' })

  try {
    // Parse data
    let tags: any[] = []
    if (Array.isArray(rawData)) {
      tags = rawData
    } else if (format === 'json') {
      tags = Array.isArray(rawData) ? rawData : [rawData]
    } else if (format === 'csv') {
      tags = await parseTagsCsv(rawData)
    } else if (format === 'xml') {
      tags = minimalXmlParse(String(rawData || ''), 'tag')
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    updateAdminImport(importId, { totalRecords: tags.length })

    await importTagsInline(importId, tags, options)

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
          completedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(schema.importLogs.importId, importId))
        .run()
      updateAdminImport(importId, { status: 'completed', completedAt: new Date() as any })
    } catch {}

  } catch (e: any) {
    const p = getAdminImport(importId)!
    updateAdminImport(importId, { status: 'failed', completedAt: new Date() as any, errors: [...p.errors, e.message] })
    throw e
  }
}

export async function parseTagsCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0] ?? '')
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, idx) => {
      const v = values[idx] ?? null
      obj[h] = v
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
