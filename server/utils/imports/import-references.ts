import type { ImportOptions } from '../../types'
import { getAdminImport, updateAdminImport } from '../admin-import-progress'
import { validateReferenceDataZod } from '../validation/reference'
import { uploadBackupFile } from '../backup-storage'
import { createBackupFile } from '../backup-database'
import { createImportReport } from '../import-report'
import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export async function importReferencesInline(parentImportId: string, references: any[], options: ImportOptions) {
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
      const up = await uploadBackupFile(json, `import_${parentImportId}_references.json`, 'references', 'json')

      // Lookup numeric import_log_id for linkage (best effort)
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
        filename: `import_${parentImportId}_references.json`,
        file_path: up.filePath,
        file_size: up.fileSize,
        compressed_size: up.compressedSize,
        content_hash: up.contentHash,
        compression_type: up.compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'references', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for references (${up.filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (references): ${e.message}`] })
    }
  }

  // Insert in batches (each db.batch() call is a transaction in D1)
  const refPolicy = options.conflict?.references?.mode || 'ignore'
  const refStrategy = options.conflict?.references?.updateStrategy || 'fill-missing'

  const batchSize = options.batchSize || 50
  const subSize = 10

  const report = createImportReport(parentImportId, 'references', 'ndjson')

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
          const row = await db.select({ id: schema.quoteReferences.id, name: schema.quoteReferences.name, primaryType: schema.quoteReferences.primaryType })
            .from(schema.quoteReferences)
            .where(and(sql`lower(${schema.quoteReferences.name}) = ${n}`, sql`${schema.quoteReferences.primaryType} = ${pt}`))
            .limit(1)
            .get()
          if (row?.id) existingByKey.set(k, { id: Number(row.id), name: String(row.name), primary_type: String(row.primaryType) })
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
          const updateData: any = {}
          const addFieldFill = (key: keyof typeof schema.quoteReferences, value: any) => {
             if (refStrategy === 'overwrite') {
               updateData[key] = value
             } else {
               updateData[key] = sql`COALESCE(${schema.quoteReferences[key]}, ${value})`
             }
          }
          
          addFieldFill('originalLanguage', reference.original_language || 'en')
          addFieldFill('releaseDate', reference.release_date || null)
          addFieldFill('description', reference.description || '')
          addFieldFill('secondaryType', reference.secondary_type || '')
          addFieldFill('imageUrl', reference.image_url || '')
          addFieldFill('urls', urlsField)
          addFieldFill('viewsCount', reference.views_count ?? null)
          addFieldFill('likesCount', reference.likes_count ?? null)
          addFieldFill('sharesCount', reference.shares_count ?? null)
          
          updateData.updatedAt = new Date()
          
          stmts.push(db.update(schema.quoteReferences).set(updateData).where(eq(schema.quoteReferences.id, match.id)))
          continue
        }

        // default insert; allow explicit id when preserveIds
        const explicitId = options.preserveIds && Number.isFinite(Number(reference.id)) ? Number(reference.id) : undefined
        const values = {
            id: explicitId,
            name: reference.name,
            originalLanguage: reference.original_language || 'en',
            releaseDate: reference.release_date || null,
            description: reference.description || '',
            primaryType: reference.primary_type || 'other',
            secondaryType: reference.secondary_type || '',
            imageUrl: reference.image_url || '',
            urls: urlsField,
            viewsCount: reference.views_count || 0,
            likesCount: reference.likes_count || 0,
            sharesCount: reference.shares_count || 0,
            createdAt: reference.created_at ? new Date(reference.created_at) : new Date(),
            updatedAt: reference.updated_at ? new Date(reference.updated_at) : new Date(),
        }
        stmts.push(db.insert(schema.quoteReferences).values(values))
      }

      if (skipped > 0) {
        const p0 = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          processedRecords: Math.min(p0.processedRecords + skipped, p0.totalRecords),
          warnings: [...p0.warnings, `Skipped ${skipped} duplicate references (policy: ${refPolicy}).`]
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
              errors: [...p.errors, `Failed to import "${sub[idx]?.name}": ${ie.message}`]
            })
            report.addFailure({ index: i + j + (idx + 1), reason: ie.message, item: sub[idx] })
          }
        }
        if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
      }
    }
  }
  const res = await report.finalize()
  if (res) {
    const p = getAdminImport(parentImportId)!
    const link = `/api/admin/import/report/${parentImportId}`
    updateAdminImport(parentImportId, { warnings: [...p.warnings, `Report available: ${link}`] })
  }
  // If IDs were preserved, align sqlite_sequence to MAX(id)
  if (options.preserveIds) {
    try {
      const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.quoteReferences).get()
      const maxId = Number(row?.mx || 0)
      if (maxId > 0) {
        const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'quote_references'`)
        const changes = Number(upd?.rowsAffected || 0)
        if (changes === 0) {
          try {
            await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_references', ${maxId})`)
          } catch {
            try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'quote_references'`) } catch {}
            try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_references', ${maxId})`) } catch {}
          }
        }
      }
    } catch {}
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

    await importReferencesInline(importId, references, options)

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

export async function parseReferencesCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0] ?? '')
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
    if (!m) continue
    const obj: any = {}
    let fm: RegExpExecArray | null
    const xmlBlock = String(m[1] ?? '')
    while ((fm = fieldRegex.exec(xmlBlock))) {
      if (!fm) continue
      const objKey = String(fm[1] ?? '')
      const val = String(fm[2] ?? '')
      obj[objKey] = val
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
