import type {
  ExportOptions,
  ExportResultWithBackup,
  TagExportFilters,
  ExportedTag,
} from '~/types/export'
import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin' && user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event) as ExportOptions
    const { format, filters = {}, include_relations = true, include_metadata = false, limit = 0 } = body

    if (!format) throw createError({ statusCode: 400, statusMessage: 'Export format is required' })
    if (!['json', 'csv', 'xml'].includes(format)) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported export format. Supported formats: json, csv, xml' })
    }

    const tagFilters = (filters || {}) as TagExportFilters
    const filterValidation = validateTagFilters(tagFilters)
    if (!filterValidation.valid) {
      throw createError({ statusCode: 400, statusMessage: `Invalid filters: ${filterValidation.errors.join(', ')}` })
    }

    const exportId = `tags_export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const { query, bindings } = buildTagsQuery(tagFilters, include_relations, limit)
    const resultSet = await db.$client.execute({
      sql: query,
      args: bindings
    })
    const results = (resultSet.rows ?? []) as any[]

    const processed: ExportedTag[] = results.map((t: any) => {
      const out: ExportedTag = {
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        category: t.category || undefined,
        color: t.color,
        created_at: t.created_at,
        updated_at: t.updated_at,
        usage_count: typeof t.usage_count === 'number' ? t.usage_count : undefined,
      }

      if (include_metadata) {
        out._metadata = {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          export_id: exportId,
          export_filters: tagFilters,
        }
      }
      return out
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tags-export-${timestamp}.${format}`

    let contentData = ''
    let mimeType = 'application/json'

    switch (format) {
      case 'json':
        contentData = JSON.stringify(processed, null, 2)
        mimeType = 'application/json'
        break
      case 'csv':
        contentData = generateTagsCSV(processed)
        mimeType = 'text/csv'
        break
      case 'xml':
        contentData = generateTagsXML(processed)
        mimeType = 'application/xml'
        break
      default:
        throw createError({ statusCode: 400, statusMessage: 'Unsupported export format' })
    }

    const fileSize: number = new TextEncoder().encode(contentData).length

    const { exportLogId } = await logTagsExport(db, {
      exportId,
      filename,
      format,
      filters: tagFilters,
      recordCount: processed.length,
      userId: user.id,
      fileSize,
      includeRelations: include_relations,
      includeMetadata: include_metadata,
    })

    const backupResult = await createBackup(
      contentData,
      filename,
      'tags',
      format,
      {
        exportLogId,
        retentionDays: 90,
        metadata: {
          export_config: body,
          filters: tagFilters,
          created_by: user.id,
          backup_type: 'export',
          data_type: 'tags'
        }
      }
    )

    const backupInfo = {
      backup_id: backupResult.backupId,
      file_key: backupResult.fileKey,
      file_path: backupResult.filePath,
      storage_status: 'stored' as const,
      backup_download_url: `/api/admin/backup/download/${backupResult.backupId}`,
      retention_days: 90,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }

    const result: ExportResultWithBackup = {
      success: true,
      data: {
        export_id: exportId,
        filename,
        format,
        record_count: processed.length,
        file_size: fileSize,
        download_url: `/api/admin/export/download/${exportId}`,
        options: body,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      backup: backupInfo
    }

    if (contentData.length < 5 * 1024 * 1024) {
      (result.data as any).content = contentData
      ;(result.data as any).mimeType = mimeType
    }

    return result

  } catch (error: any) {
    console.error('Tags export error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Export failed' })
  }
})

function validateTagFilters(filters: TagExportFilters) {
  const validation = { valid: true, errors: [] as string[] }
  if (filters.date_range?.start && filters.date_range?.end) {
    const s = new Date(filters.date_range.start)
    const e = new Date(filters.date_range.end)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) { validation.valid = false; validation.errors.push('Invalid date format') }
    else if (s > e) { validation.valid = false; validation.errors.push('Start date must be before end date') }
  }
  if (filters.min_usage !== undefined && (filters.min_usage < 0 || !Number.isInteger(filters.min_usage))) {
    validation.valid = false; validation.errors.push('min_usage must be a non-negative integer')
  }
  return validation
}

function buildTagsQuery(filters: TagExportFilters, includeRelations: boolean, limit: number) {
  let query = `SELECT t.*${includeRelations ? ', COUNT(qt.quote_id) as usage_count' : ''} FROM tags t`
  const where: string[] = []
  const bindings: any[] = []
  let joinedUsage = false

  if (includeRelations || filters.unused_only || (typeof filters.min_usage === 'number' && filters.min_usage > 0)) {
    query += ` LEFT JOIN quote_tags qt ON t.id = qt.tag_id`
    joinedUsage = true
  }

  if (filters.search && filters.search.trim()) {
    where.push('(t.name LIKE ? OR t.description LIKE ?)')
    bindings.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`)
  }
  if (filters.category) {
    const cats = Array.isArray(filters.category) ? filters.category : [filters.category]
    where.push(`t.category IN (${cats.map(() => '?').join(',')})`)
    bindings.push(...cats)
  }
  if (filters.color) {
    const cols = Array.isArray(filters.color) ? filters.color : [filters.color]
    where.push(`t.color IN (${cols.map(() => '?').join(',')})`)
    bindings.push(...cols)
  }
  if (filters.date_range?.start) { where.push('t.created_at >= ?'); bindings.push(filters.date_range.start) }
  if (filters.date_range?.end) { where.push('t.created_at <= ?'); bindings.push(filters.date_range.end + ' 23:59:59') }

  if (where.length) query += ` WHERE ${where.join(' AND ')}`

  if (joinedUsage) query += ' GROUP BY t.id'
  if (filters.unused_only) query += ' HAVING COUNT(qt.quote_id) = 0'
  else if (typeof filters.min_usage === 'number' && filters.min_usage > 0) {
    query += ' HAVING COUNT(qt.quote_id) >= ?'
    bindings.push(filters.min_usage)
  }

  query += ' ORDER BY t.created_at DESC'
  if (limit > 0) { query += ' LIMIT ?'; bindings.push(limit) }

  return { query, bindings }
}

function generateTagsCSV(tags: ExportedTag[]): string {
  if (!tags.length) return ''
  const headers = ['id','name','description','category','color','usage_count','created_at','updated_at']
  const esc = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const lines = [headers.join(','), ...tags.map(t => headers.map(h => esc((t as any)[h])).join(','))]
  return lines.join('\n')
}

function generateTagsXML(tags: ExportedTag[]): string {
  const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')
  const serialize = (t: ExportedTag) => [
    `  <tag>`,
    `    <id>${t.id}</id>`,
    `    <name><![CDATA[${t.name}]]></name>`,
    t.description ? `    <description><![CDATA[${t.description}]]></description>` : undefined,
    t.category ? `    <category><![CDATA[${t.category}]]></category>` : undefined,
    `    <color>${esc(t.color)}</color>`,
    typeof t.usage_count === 'number' ? `    <usage_count>${t.usage_count}</usage_count>` : undefined,
    `    <created_at>${t.created_at}</created_at>`,
    `    <updated_at>${t.updated_at}</updated_at>`,
    `  </tag>`
  ].filter(Boolean).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<tags>\n${tags.map(serialize).join('\n')}\n</tags>`
}

async function logTagsExport(db: any, info: {
  exportId: string
  filename: string
  format: string
  filters: TagExportFilters
  recordCount: number
  userId: number
  fileSize: number
  includeRelations: boolean
  includeMetadata: boolean
}): Promise<{ exportLogId: number }> {
  const filtersApplied = JSON.stringify(info.filters || {})
  const [row] = await db.insert(schema.exportLogs)
    .values({
      exportId: info.exportId,
      filename: info.filename,
      format: info.format,
      dataType: 'tags',
      filtersApplied,
      recordCount: info.recordCount,
      fileSize: info.fileSize,
      userId: info.userId,
      includeRelations: info.includeRelations,
      includeMetadata: info.includeMetadata,
    })
    .returning({ exportLogId: schema.exportLogs.id })

  return { exportLogId: row?.exportLogId ?? 0 }
}

