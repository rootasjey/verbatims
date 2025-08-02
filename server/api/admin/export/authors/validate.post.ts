/**
 * Admin API: Validate Authors Export
 * Provides preview and validation for authors export with filtering
 */

import type { ExportOptions, AuthorExportFilters, ExportValidation } from '~/types/export'
import { validateFiltersForAuthorsExport } from '~/server/utils/export-filters'

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
    const filterValidation = validateFiltersForAuthorsExport(filters as AuthorExportFilters)
    if (!filterValidation.valid) {
      validation.errors.push(...filterValidation.errors)
      validation.valid = false
    }

    if (filterValidation.warnings) {
      validation.warnings.push(...filterValidation.warnings)
    }

    if (limit && limit < 0) {
      validation.errors.push('Record limit must be 0 or greater')
      validation.valid = false
    }

    if (!validation.valid) {
      return {
        success: false,
        data: validation
      }
    }

    const db = hubDatabase()
    if (!db) {
      validation.errors.push('Database not available')
      validation.valid = false
      return {
        success: false,
        data: validation
      }
    }

    // Build query to estimate count and size
    const { query, bindings } = buildAuthorsQuery(filters as AuthorExportFilters, body.include_relations || false, limit)

    try {
      // Get estimated count - need to wrap the original query to handle GROUP BY
      const countQuery = `SELECT COUNT(*) as count FROM (${query}) as subquery`
      const countResult = await db.prepare(countQuery).bind(...bindings).first()
      const estimatedCount = Number(countResult?.count) || 0

      validation.estimated_count = estimatedCount

      // Estimate file size based on format and record count
      validation.estimated_size = estimateAuthorsFileSize(format, estimatedCount, body.include_relations || false)

      // Add warnings based on estimates
      if (estimatedCount === 0) {
        validation.warnings.push('No authors match the current filters. Export will be empty.')
      } else if (estimatedCount > 10000) {
        validation.warnings.push(`Large export detected (${estimatedCount.toLocaleString()} records). Consider using filters to reduce the dataset.`)
      }

      if (validation.estimated_size > 50 * 1024 * 1024) { // 50MB
        validation.warnings.push(`Large file size estimated (${formatFileSize(validation.estimated_size)}). Export may take several minutes.`)
      }

      // Check for potentially slow queries
      if (filters.search && filters.search.length < 3) {
        validation.warnings.push('Short search terms may result in slower exports. Consider using longer, more specific search terms.')
      }

      // Authors-specific warnings
      const authorsFilters = filters as AuthorExportFilters
      if (authorsFilters.birth_date_range?.start || authorsFilters.death_date_range?.start) {
        validation.warnings.push('Date range filters on birth/death dates may exclude authors with missing date information.')
      }

      if (authorsFilters.is_fictional !== undefined) {
        const typeLabel = authorsFilters.is_fictional ? 'fictional characters' : 'real people'
        validation.warnings.push(`Export filtered to include only ${typeLabel}.`)
      }

    } catch (error) {
      console.error('Failed to estimate authors export size:', error)
      validation.warnings.push('Unable to estimate export size. Proceeding with export may take longer than expected.')
    }

    return {
      success: true,
      data: validation
    }

  } catch (error: any) {
    console.error('Authors export validation error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to validate authors export'
    })
  }
})

/**
 * Build authors query with filters (reused from authors export)
 */
function buildAuthorsQuery(filters: AuthorExportFilters, includeRelations: boolean, limit: number) {
  // Base query with optional relations
  let query = `
    SELECT 
      a.*
      ${includeRelations ? `,
        COUNT(q.id) as quotes_count
      ` : ''}
    FROM authors a
    ${includeRelations ? `
      LEFT JOIN quotes q ON a.id = q.author_id AND q.status = 'approved'
    ` : ''}
  `

  // Build filter conditions
  const conditions: string[] = []
  const bindings: any[] = []

  if (filters.search) {
    conditions.push('a.name LIKE ?')
    bindings.push(`%${filters.search}%`)
  }

  if (filters.is_fictional !== undefined) {
    conditions.push('a.is_fictional = ?')
    bindings.push(filters.is_fictional)
  }

  if (filters.job) {
    conditions.push('a.job LIKE ?')
    bindings.push(`%${filters.job}%`)
  }

  if (filters.birth_location) {
    conditions.push('a.birth_location LIKE ?')
    bindings.push(`%${filters.birth_location}%`)
  }

  if (filters.death_location) {
    conditions.push('a.death_location LIKE ?')
    bindings.push(`%${filters.death_location}%`)
  }

  if (filters.date_range?.start) {
    conditions.push('a.created_at >= ?')
    bindings.push(filters.date_range.start)
  }

  if (filters.date_range?.end) {
    conditions.push('a.created_at <= ?')
    bindings.push(filters.date_range.end + ' 23:59:59')
  }

  if (filters.birth_date_range?.start) {
    conditions.push('a.birth_date >= ?')
    bindings.push(filters.birth_date_range.start)
  }

  if (filters.birth_date_range?.end) {
    conditions.push('a.birth_date <= ?')
    bindings.push(filters.birth_date_range.end)
  }

  if (filters.death_date_range?.start) {
    conditions.push('a.death_date >= ?')
    bindings.push(filters.death_date_range.start)
  }

  if (filters.death_date_range?.end) {
    conditions.push('a.death_date <= ?')
    bindings.push(filters.death_date_range.end)
  }

  if (filters.min_views && filters.min_views > 0) {
    conditions.push('a.views_count >= ?')
    bindings.push(filters.min_views)
  }

  if (filters.min_likes && filters.min_likes > 0) {
    conditions.push('a.likes_count >= ?')
    bindings.push(filters.min_likes)
  }

  // Add WHERE clause if we have conditions
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  // Add GROUP BY for relations
  if (includeRelations) {
    query += ' GROUP BY a.id'
  }

  // Add HAVING clause for quotes count filter
  if (filters.min_quotes && filters.min_quotes > 0 && includeRelations) {
    query += ` HAVING quotes_count >= ${filters.min_quotes}`
  }

  // Add ORDER BY
  query += ' ORDER BY a.created_at DESC'

  // Add LIMIT if specified
  if (limit > 0) {
    query += ' LIMIT ?'
    bindings.push(limit)
  }

  return { query, bindings }
}

/**
 * Estimate file size for authors export
 */
function estimateAuthorsFileSize(format: string, recordCount: number, includeRelations: boolean): number {
  if (recordCount === 0) return 0

  // Base size per author record (in bytes)
  let baseSize = 300 // Basic author data (name, dates, locations, job, etc.)

  if (includeRelations) {
    baseSize += 50 // Quote count
  }

  // Authors typically have more text data than quotes
  baseSize += 200 // Description, socials, additional metadata

  // Format multipliers
  const formatMultipliers = {
    json: 1.3, // JSON has overhead with field names and nested objects
    csv: 0.7,  // CSV is more compact for authors
    xml: 2.0   // XML has significant tag overhead, especially for nested data
  }

  const multiplier = formatMultipliers[format as keyof typeof formatMultipliers] || 1

  return Math.round(recordCount * baseSize * multiplier)
}



/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
