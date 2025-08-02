/**
 * Admin API: Validate References Export
 * Provides preview and validation for references export with filtering
 */

import type { ExportOptions, ReferenceExportFilters, ExportValidation } from '~/types/export'
import { validateFiltersForReferencesExport } from '~/server/utils/export-filters'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const body = await readBody(event) as ExportOptions
    const { format, filters = {}, limit = 0 } = body

    const validation: ExportValidation = {
      valid: true,
      errors: [],
      warnings: []
    }

    // Validate format
    if (!format) {
      validation.errors.push('Export format is required')
      validation.valid = false
    } else if (!['json', 'csv', 'xml'].includes(format)) {
      validation.errors.push('Unsupported export format. Supported formats: json, csv, xml')
      validation.valid = false
    }

    // Validate filters
    const filterValidation = validateFiltersForReferencesExport(filters as ReferenceExportFilters)
    if (!filterValidation.valid) {
      validation.errors.push(...filterValidation.errors)
      validation.valid = false
    }

    if (filterValidation.warnings) {
      validation.warnings.push(...filterValidation.warnings)
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Build query to estimate count and size
    const { query, bindings } = buildReferencesQuery(filters as ReferenceExportFilters, true, limit)

    // Get estimated count - need to wrap the original query to handle GROUP BY
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as subquery`
    const countResult = await db.prepare(countQuery).bind(...bindings).first()
    const estimatedCount = Number(countResult?.count) || 0

    // Add warnings based on count
    if (estimatedCount === 0) {
      validation.warnings.push('No references match the current filters')
    } else if (estimatedCount > 10000) {
      validation.warnings.push(`Large export detected (${estimatedCount.toLocaleString()} records). Consider adding filters to reduce size.`)
    }

    // Estimate file size (rough calculation)
    const avgRecordSize = format === 'json' ? 800 : format === 'csv' ? 400 : 1000 // bytes per record
    const estimatedSize = estimatedCount * avgRecordSize

    if (estimatedSize > 50 * 1024 * 1024) { // 50MB
      validation.warnings.push('Export file may be very large. Consider using filters to reduce size.')
    }

    // Add validation data
    validation.estimated_count = estimatedCount
    validation.estimated_size = estimatedSize

    return {
      success: true,
      data: validation
    }

  } catch (error: any) {
    console.error('References export validation error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to validate references export'
    })
  }
})

/**
 * Build references query with filters
 */
function buildReferencesQuery(filters: ReferenceExportFilters, includeRelations: boolean, limit: number) {
  const conditions: string[] = []
  const bindings: any[] = []

  // Base query
  let query = `
    SELECT
      r.id,
      r.name,
      r.primary_type,
      r.secondary_type,
      r.release_date,
      r.description,
      r.urls,
      r.created_at,
      r.updated_at
  `

  if (includeRelations) {
    query += `,
      COUNT(q.id) as quotes_count
    `
  }

  query += ` FROM quote_references r`

  if (includeRelations) {
    query += ` LEFT JOIN quotes q ON r.id = q.reference_id`
  }

  // Apply filters
  if (filters.primary_type) {
    const types = Array.isArray(filters.primary_type) ? filters.primary_type : [filters.primary_type]
    if (types.length > 0) {
      const placeholders = types.map(() => '?').join(',')
      conditions.push(`r.primary_type IN (${placeholders})`)
      bindings.push(...types)
    }
  }

  if (filters.secondary_type) {
    const types = Array.isArray(filters.secondary_type) ? filters.secondary_type : [filters.secondary_type]
    if (types.length > 0) {
      const placeholders = types.map(() => '?').join(',')
      conditions.push(`r.secondary_type IN (${placeholders})`)
      bindings.push(...types)
    }
  }

  if (filters.search && filters.search.trim()) {
    conditions.push(`r.name LIKE ?`)
    bindings.push(`%${filters.search.trim()}%`)
  }

  if (filters.date_range?.start && filters.date_range.start.trim()) {
    conditions.push(`r.created_at >= ?`)
    bindings.push(filters.date_range.start)
  }

  if (filters.date_range?.end && filters.date_range.end.trim()) {
    conditions.push(`r.created_at <= ?`)
    bindings.push(filters.date_range.end)
  }

  if (filters.release_date_range?.start && filters.release_date_range.start.trim()) {
    conditions.push(`r.release_date >= ?`)
    bindings.push(filters.release_date_range.start)
  }

  if (filters.release_date_range?.end && filters.release_date_range.end.trim()) {
    conditions.push(`r.release_date <= ?`)
    bindings.push(filters.release_date_range.end)
  }

  if (filters.min_views !== undefined && filters.min_views > 0) {
    conditions.push(`r.views_count >= ?`)
    bindings.push(filters.min_views)
  }

  // Add WHERE clause
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  // Add GROUP BY for relations
  if (includeRelations) {
    query += ` GROUP BY r.id`

    // Add HAVING clause for min_quotes filter
    if (filters.min_quotes !== undefined && filters.min_quotes > 0) {
      query += ` HAVING quotes_count >= ?`
      bindings.push(filters.min_quotes)
    }
  }

  // Add ORDER BY
  query += ` ORDER BY r.created_at DESC`

  // Add LIMIT
  if (limit > 0) {
    query += ` LIMIT ?`
    bindings.push(limit)
  }

  return { query, bindings }
}
