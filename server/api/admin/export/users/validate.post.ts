/**
 * Admin API: Validate Users Export
 * Provides preview and validation for users export with filtering
 */

import type { ExportOptions, UserExportFilters, ExportValidation } from '~/types/export'

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
    const filterValidation = validateFiltersForUsersExport(filters as UserExportFilters)
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
    const { query, bindings } = buildUsersQuery(filters as UserExportFilters, body.include_relations || false, limit)

    try {
      // Get estimated count - need to wrap the original query to handle GROUP BY
      const countQuery = `SELECT COUNT(*) as count FROM (${query}) as subquery`
      const countResult = await db.prepare(countQuery).bind(...bindings).first()
      const estimatedCount = Number(countResult?.count) || 0

      validation.estimated_count = estimatedCount

      // Estimate file size based on format and record count
      validation.estimated_size = estimateUsersFileSize(format, estimatedCount, body.include_relations || false)

      // Add warnings based on estimates
      if (estimatedCount === 0) {
        validation.warnings.push('No users match the current filters. Export will be empty.')
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

      // Users-specific warnings
      const usersFilters = filters as UserExportFilters
      if (usersFilters.last_login_range?.start || usersFilters.last_login_range?.end) {
        validation.warnings.push('Last login date filters may exclude users who have never logged in.')
      }

      if (usersFilters.role && Array.isArray(usersFilters.role) && usersFilters.role.length > 0) {
        const roleLabels = usersFilters.role.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')
        validation.warnings.push(`Export filtered to include only users with roles: ${roleLabels}.`)
      }

      if (usersFilters.email_verified !== undefined) {
        const statusLabel = usersFilters.email_verified ? 'verified' : 'unverified'
        validation.warnings.push(`Export filtered to include only users with ${statusLabel} email addresses.`)
      }

      if (usersFilters.is_active !== undefined) {
        const statusLabel = usersFilters.is_active ? 'active' : 'inactive'
        validation.warnings.push(`Export filtered to include only ${statusLabel} user accounts.`)
      }

    } catch (error) {
      console.error('Failed to estimate users export size:', error)
      validation.warnings.push('Unable to estimate export size. Proceeding with export may take longer than expected.')
    }

    return {
      success: true,
      data: validation
    }

  } catch (error: any) {
    console.error('Users export validation error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to validate users export'
    })
  }
})

/**
 * Build users query with filters (reused from users export)
 */
function buildUsersQuery(filters: UserExportFilters, includeRelations: boolean, limit: number) {
  // Base query with optional relations
  let query = `
    SELECT 
      u.*
      ${includeRelations ? `,
        COUNT(DISTINCT q.id) as quotes_count,
        COUNT(DISTINCT c.id) as collections_count
      ` : ''}
    FROM users u
    ${includeRelations ? `
      LEFT JOIN quotes q ON u.id = q.user_id AND q.status = 'approved'
      LEFT JOIN user_collections c ON u.id = c.user_id
    ` : ''}
  `

  // Build filter conditions
  const conditions: string[] = []
  const bindings: any[] = []

  if (filters.search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)')
    bindings.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  if (filters.role && Array.isArray(filters.role) && filters.role.length > 0) {
    const placeholders = filters.role.map(() => '?').join(',')
    conditions.push(`u.role IN (${placeholders})`)
    bindings.push(...filters.role)
  }

  if (filters.email_verified !== undefined) {
    conditions.push('u.email_verified = ?')
    bindings.push(filters.email_verified)
  }

  if (filters.is_active !== undefined) {
    conditions.push('u.is_active = ?')
    bindings.push(filters.is_active)
  }

  if (filters.language && Array.isArray(filters.language) && filters.language.length > 0) {
    const placeholders = filters.language.map(() => '?').join(',')
    conditions.push(`u.language IN (${placeholders})`)
    bindings.push(...filters.language)
  }

  if (filters.location) {
    conditions.push('u.location LIKE ?')
    bindings.push(`%${filters.location}%`)
  }

  if (filters.job) {
    conditions.push('u.job LIKE ?')
    bindings.push(`%${filters.job}%`)
  }

  if (filters.date_range?.start) {
    conditions.push('u.created_at >= ?')
    bindings.push(filters.date_range.start)
  }

  if (filters.date_range?.end) {
    conditions.push('u.created_at <= ?')
    bindings.push(filters.date_range.end + ' 23:59:59')
  }

  if (filters.last_login_range?.start) {
    conditions.push('u.last_login_at >= ?')
    bindings.push(filters.last_login_range.start)
  }

  if (filters.last_login_range?.end) {
    conditions.push('u.last_login_at <= ?')
    bindings.push(filters.last_login_range.end + ' 23:59:59')
  }

  // Add WHERE clause if we have conditions
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  // Add GROUP BY for relations
  if (includeRelations) {
    query += ' GROUP BY u.id'
  }

  // Add HAVING clause for activity filters
  if (filters.min_quotes && filters.min_quotes > 0 && includeRelations) {
    query += ` HAVING quotes_count >= ${filters.min_quotes}`
  }

  if (filters.min_collections && filters.min_collections > 0 && includeRelations) {
    if (query.includes('HAVING')) {
      query += ` AND collections_count >= ${filters.min_collections}`
    } else {
      query += ` HAVING collections_count >= ${filters.min_collections}`
    }
  }

  // Add ORDER BY
  query += ' ORDER BY u.created_at DESC'

  // Add LIMIT if specified
  if (limit > 0) {
    query += ' LIMIT ?'
    bindings.push(limit)
  }

  return { query, bindings }
}

/**
 * Estimate file size for users export
 */
function estimateUsersFileSize(format: string, recordCount: number, includeRelations: boolean): number {
  if (recordCount === 0) return 0

  // Base size per user record (in bytes)
  let baseSize = 250 // Basic user data (email, name, role, etc.)

  if (includeRelations) {
    baseSize += 100 // Quote count, collection count
  }

  // Users typically have less text data than authors but more structured data
  baseSize += 150 // Biography, job, socials, additional metadata

  // Format multipliers
  const formatMultipliers = {
    json: 1.2, // JSON has overhead with field names
    csv: 0.8,  // CSV is more compact for users
    xml: 1.8   // XML has tag overhead
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

/**
 * Validate filters for users export
 */
function validateFiltersForUsersExport(filters: UserExportFilters) {
  const validation = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  }

  // Validate date ranges
  if (filters.date_range?.start && filters.date_range?.end) {
    if (new Date(filters.date_range.start) > new Date(filters.date_range.end)) {
      validation.errors.push('Date range start must be before end date')
      validation.valid = false
    }
  }

  if (filters.last_login_range?.start && filters.last_login_range?.end) {
    if (new Date(filters.last_login_range.start) > new Date(filters.last_login_range.end)) {
      validation.errors.push('Last login date range start must be before end date')
      validation.valid = false
    }
  }

  // Validate numeric filters
  if (filters.min_quotes !== undefined && filters.min_quotes < 0) {
    validation.errors.push('Minimum quotes count must be non-negative')
    validation.valid = false
  }

  if (filters.min_collections !== undefined && filters.min_collections < 0) {
    validation.errors.push('Minimum collections count must be non-negative')
    validation.valid = false
  }

  // Validate role filter
  if (filters.role && Array.isArray(filters.role)) {
    const validRoles = ['user', 'moderator', 'admin']
    const invalidRoles = filters.role.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      validation.errors.push(`Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}`)
      validation.valid = false
    }
  }

  // Validate language filter
  if (filters.language && Array.isArray(filters.language)) {
    const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
    const invalidLanguages = filters.language.filter(lang => !validLanguages.includes(lang))
    if (invalidLanguages.length > 0) {
      validation.errors.push(`Invalid languages: ${invalidLanguages.join(', ')}. Valid languages are: ${validLanguages.join(', ')}`)
      validation.valid = false
    }
  }

  return validation
}
