import { getQuery } from 'h3'
import { downloadBackupFile } from '~/server/utils/backup-storage'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const importId = getRouterParam(event, 'id')
  if (!importId) throw createError({ statusCode: 400, statusMessage: 'Import ID is required' })

  const db = hubDatabase()

  // Try to discover backup file by metadata first (preferred)
  const q = getQuery(event)
  const requestedFormat = (typeof q.format === 'string' ? q.format.toLowerCase() : 'ndjson') as 'ndjson' | 'csv'

  // Prefer a report with the requested format if available
  const row: any = await db.prepare(`
    SELECT bf.* FROM backup_files bf
    WHERE bf.metadata IS NOT NULL
      AND json_extract(bf.metadata, '$.kind') = 'import-report'
      AND json_extract(bf.metadata, '$.import_id') = ?
    ORDER BY CASE WHEN json_extract(bf.metadata, '$.format') = ? THEN 0 ELSE 1 END, bf.created_at DESC
    LIMIT 1
  `).bind(importId, requestedFormat).first()

  if (!row) {
    // If not found, return 404 but include a hint
    throw createError({ statusCode: 404, statusMessage: 'No report found for this import' })
  }

  const blob = hubBlob()
  const fileKey = String(row.file_key)
  const file = await blob.get(fileKey)
  if (!file) throw createError({ statusCode: 404, statusMessage: 'Report file missing from storage' })

  const inline = q.inline === '1'

  // Inspect stored format from metadata
  let storedFormat: 'ndjson' | 'csv' = 'ndjson'
  try {
    const meta = row.metadata ? JSON.parse(String(row.metadata)) : null
    if (meta && (meta.format === 'ndjson' || meta.format === 'csv')) storedFormat = meta.format
  } catch {}

  // If format matches, stream raw blob
  if (storedFormat === requestedFormat) {
    const filename = row.filename || `import-report.${storedFormat}`
    setHeader(event, 'Content-Type', storedFormat === 'csv' ? 'text/csv' : 'application/x-ndjson')
    setHeader(event, 'Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${filename}"`)
    return file.stream()
  }

  // Else: convert on-the-fly
  const compression = (row.compression_type === 'gzip' ? 'gzip' : 'none') as 'gzip' | 'none'
  const { content } = await downloadBackupFile(String(row.file_key), compression)
  let out = ''
  if (storedFormat === 'ndjson' && requestedFormat === 'csv') {
    // Convert NDJSON -> CSV
    const lines = content.split(/\r?\n/).filter(Boolean)
    const rows: any[] = []
    for (const line of lines) {
      try { rows.push(JSON.parse(line)) } catch {}
    }
    const escape = (v: any) => {
      if (v == null) return ''
      const s = typeof v === 'string' ? v : JSON.stringify(v)
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    out += 'kind,index,reason,item\n'
    for (const r of rows) {
      out += `${r.kind || ''},${r.index ?? ''},${escape(r.reason)},${escape(r.item)}\n`
    }
    setHeader(event, 'Content-Type', 'text/csv')
    setHeader(event, 'Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="import-report-${importId}.csv"`)
    return out
  }
  if (storedFormat === 'csv' && requestedFormat === 'ndjson') {
    // Convert CSV -> NDJSON (very simple CSV parser expecting our header)
    const lines = content.split(/\r?\n/).filter(Boolean)
    const header = lines.shift() || ''
    const headers = header.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const idxKind = headers.indexOf('kind')
    const idxIndex = headers.indexOf('index')
    const idxReason = headers.indexOf('reason')
    const idxItem = headers.indexOf('item')
    const parseLine = (line: string) => {
      const cols: string[] = []
      let cur = ''
      let inQ = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') inQ = !inQ
        else if (ch === ',' && !inQ) { cols.push(cur); cur = '' }
        else cur += ch
      }
      cols.push(cur)
      return cols.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'))
    }
    for (const line of lines) {
      const cols = parseLine(line)
      const obj: any = {
        kind: cols[idxKind] || 'failure',
        index: cols[idxIndex] ? Number(cols[idxIndex]) : undefined,
        reason: cols[idxReason] || '',
      }
      const itemStr = cols[idxItem]
      if (itemStr) {
        try { obj.item = JSON.parse(itemStr) } catch { obj.item = itemStr }
      }
      out += JSON.stringify(obj) + '\n'
    }
    setHeader(event, 'Content-Type', 'application/x-ndjson')
    setHeader(event, 'Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="import-report-${importId}.ndjson"`)
    return out
  }

  // Fallback: return raw as octet-stream
  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="import-report-${importId}.bin"`)
  // Re-read to satisfy type guard (should exist; earlier fetched)
  const file2 = await blob.get(fileKey)
  if (!file2) throw createError({ statusCode: 404, statusMessage: 'Report file missing from storage' })
  return file2.stream()
})
