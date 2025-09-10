import type { ExportOptions, ExportValidation, TagExportFilters } from '~/types/export'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
  }

  const body = await readBody(event) as ExportOptions
  const { format, filters = {}, limit = 0 } = body

  const validation: ExportValidation = { valid: true, errors: [], warnings: [] }

  if (!format || !['json', 'csv', 'xml'].includes(format)) {
    validation.errors.push('Unsupported export format. Supported formats: json, csv, xml')
    validation.valid = false
  }

  const tagFilters = (filters || {}) as TagExportFilters

  // Date range validation
  if (tagFilters.date_range?.start && tagFilters.date_range?.end) {
    const start = new Date(tagFilters.date_range.start)
    const end = new Date(tagFilters.date_range.end)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      validation.errors.push('Invalid date format. Use YYYY-MM-DD')
      validation.valid = false
    } else if (start > end) {
      validation.errors.push('Start date must be before end date')
      validation.valid = false
    }
  }

  if (tagFilters.min_usage !== undefined && (tagFilters.min_usage < 0 || !Number.isInteger(tagFilters.min_usage))) {
    validation.errors.push('min_usage must be a non-negative integer')
    validation.valid = false
  }

  if (limit !== undefined && limit !== null && (limit as number) < 0) {
    validation.errors.push('limit must be >= 0')
    validation.valid = false
  }

  // Quick estimate
  try {
    const db = hubDatabase()
    const { query, bindings } = buildTagsCountQuery(tagFilters)
    const countRow = await db.prepare(query).bind(...bindings).first()
    const estimated = Number(countRow?.total || 0)
    validation.estimated_count = estimated
  } catch (e) {
    // Non-fatal for validation
    validation.warnings.push('Failed to estimate record count')
  }

  return { success: true, data: validation }
})

function buildTagsCountQuery(filters: TagExportFilters) {
  let query = `SELECT COUNT(DISTINCT t.id) as total FROM tags t`
  const where: string[] = []
  const bindings: any[] = []
  let joinedUsage = false

  if (filters.unused_only || (typeof filters.min_usage === 'number' && filters.min_usage > 0)) {
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

  if (joinedUsage) {
    query += ' GROUP BY t.id'
    if (filters.unused_only) query += ' HAVING COUNT(qt.quote_id) = 0'
    else if (typeof filters.min_usage === 'number' && filters.min_usage > 0) query += ' HAVING COUNT(qt.quote_id) >= ?'
    if (typeof filters.min_usage === 'number' && filters.min_usage > 0) bindings.push(filters.min_usage)
  }

  return { query, bindings }
}

