/**
 * Server-side Export Filter Utilities
 * Provides server-specific filter handling for export endpoints
 */

import type {
  QuoteExportFilters,
  ReferenceExportFilters,
  AuthorExportFilters,
  RawExportFilters,
  FilterValidationResult,
  ExportLogEntry
} from '~/types/export'

/**
 * Parse filters from database export log with error handling
 */
export function parseFiltersFromExportLog(
  exportLog: ExportLogEntry | any
): QuoteExportFilters {
  try {
    if (!exportLog?.filters_applied) {
      return { date_range: { start: '', end: '' } }
    }

    const rawFilters = JSON.parse(exportLog.filters_applied) as RawExportFilters
    return sanitizeFiltersForQuery(rawFilters)
  } catch (error) {
    console.warn('Failed to parse filters from export log:', error)
    return { date_range: { start: '', end: '' } }
  }
}

/**
 * Sanitize and validate filters for database queries
 */
export function sanitizeFiltersForQuery(rawFilters: RawExportFilters): QuoteExportFilters {
  const sanitized: Partial<QuoteExportFilters> = {}

  // Status filter - ensure valid values
  if (rawFilters.status !== undefined) {
    if (Array.isArray(rawFilters.status)) {
      const validStatuses = rawFilters.status.filter(status => 
        typeof status === 'string' && ['draft', 'pending', 'approved', 'rejected'].includes(status)
      )
      if (validStatuses.length > 0) {
        sanitized.status = validStatuses as any[]
      }
    } else if (typeof rawFilters.status === 'string' && 
               ['draft', 'pending', 'approved', 'rejected'].includes(rawFilters.status)) {
      sanitized.status = rawFilters.status as any
    }
  }

  // Language filter - ensure valid values
  if (rawFilters.language !== undefined) {
    if (Array.isArray(rawFilters.language)) {
      const validLanguages = rawFilters.language.filter(lang => 
        typeof lang === 'string' && ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh'].includes(lang)
      )
      if (validLanguages.length > 0) {
        sanitized.language = validLanguages as any[]
      }
    } else if (typeof rawFilters.language === 'string' && 
               ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh'].includes(rawFilters.language)) {
      sanitized.language = rawFilters.language as any
    }
  }

  // Numeric ID filters with validation
  const numericFields = ['author_id', 'user_id', 'moderator_id', 'min_views', 'min_likes'] as const
  
  for (const field of numericFields) {
    if (rawFilters[field] !== undefined) {
      const value = typeof rawFilters[field] === 'string' 
        ? parseInt(rawFilters[field] as string, 10) 
        : rawFilters[field] as number
      
      if (!isNaN(value) && value >= 0) {
        sanitized[field] = value
      }
    }
  }

  // String filters with trimming
  const stringFields = ['author_name', 'search'] as const
  
  for (const field of stringFields) {
    if (rawFilters[field] && typeof rawFilters[field] === 'string') {
      const trimmed = (rawFilters[field] as string).trim()
      if (trimmed.length > 0) {
        sanitized[field] = trimmed
      }
    }
  }

  // Boolean filters
  if (rawFilters.featured_only !== undefined) {
    if (typeof rawFilters.featured_only === 'boolean') {
      sanitized.featured_only = rawFilters.featured_only
    } else if (typeof rawFilters.featured_only === 'string') {
      sanitized.featured_only = rawFilters.featured_only.toLowerCase() === 'true'
    }
  }

  // Tag IDs array
  if (rawFilters.tag_ids && Array.isArray(rawFilters.tag_ids)) {
    const validTagIds = rawFilters.tag_ids
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id as number) && (id as number) > 0) as number[]
    
    if (validTagIds.length > 0) {
      sanitized.tag_ids = validTagIds
    }
  }

  // Date range with validation
  if (rawFilters.date_range && typeof rawFilters.date_range === 'object') {
    const dateRange: { start?: string; end?: string } = {}
    
    if (rawFilters.date_range.start && typeof rawFilters.date_range.start === 'string') {
      const trimmed = rawFilters.date_range.start.trim()
      if (trimmed.length > 0 && isValidDateFormat(trimmed)) {
        dateRange.start = trimmed
      }
    }
    
    if (rawFilters.date_range.end && typeof rawFilters.date_range.end === 'string') {
      const trimmed = rawFilters.date_range.end.trim()
      if (trimmed.length > 0 && isValidDateFormat(trimmed)) {
        dateRange.end = trimmed
      }
    }
    
    if (dateRange.start && dateRange.end) {
      sanitized.date_range = {
        start: dateRange.start,
        end: dateRange.end
      }
    }
  }

  return sanitized as QuoteExportFilters
}

/**
 * Build SQL query conditions and bindings from filters
 */
export function buildFilterConditions(filters: QuoteExportFilters): {
  conditions: string[]
  bindings: any[]
} {
  const conditions: string[] = []
  const bindings: any[] = []

  // Status filter
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`q.status IN (${filters.status.map(() => '?').join(',')})`)
      bindings.push(...filters.status)
    } else {
      conditions.push('q.status = ?')
      bindings.push(filters.status)
    }
  }

  // Language filter
  if (filters.language) {
    if (Array.isArray(filters.language)) {
      conditions.push(`q.language IN (${filters.language.map(() => '?').join(',')})`)
      bindings.push(...filters.language)
    } else {
      conditions.push('q.language = ?')
      bindings.push(filters.language)
    }
  }

  // ID filters
  if (filters.author_id) {
    conditions.push('q.author_id = ?')
    bindings.push(filters.author_id)
  }

  if (filters.user_id) {
    conditions.push('q.user_id = ?')
    bindings.push(filters.user_id)
  }

  if (filters.moderator_id) {
    conditions.push('q.moderator_id = ?')
    bindings.push(filters.moderator_id)
  }

  // Author name search
  if (filters.author_name) {
    conditions.push('a.name LIKE ?')
    bindings.push(`%${filters.author_name}%`)
  }

  // Content search
  if (filters.search) {
    conditions.push('q.name LIKE ?')
    bindings.push(`%${filters.search}%`)
  }

  // Featured filter
  if (filters.featured_only) {
    conditions.push('q.is_featured = TRUE')
  }

  // Numeric filters
  if (filters.min_views !== undefined && filters.min_views > 0) {
    conditions.push('q.views_count >= ?')
    bindings.push(filters.min_views)
  }

  if (filters.min_likes !== undefined && filters.min_likes > 0) {
    conditions.push('q.likes_count >= ?')
    bindings.push(filters.min_likes)
  }

  // Date range filters
  if (filters.date_range?.start) {
    conditions.push('DATE(q.created_at) >= ?')
    bindings.push(filters.date_range.start)
  }

  if (filters.date_range?.end) {
    conditions.push('DATE(q.created_at) <= ?')
    bindings.push(filters.date_range.end)
  }

  // Tag filters (requires JOIN with quote_tags table)
  if (filters.tag_ids && filters.tag_ids.length > 0) {
    conditions.push(`q.id IN (
      SELECT DISTINCT qt.quote_id 
      FROM quote_tags qt 
      WHERE qt.tag_id IN (${filters.tag_ids.map(() => '?').join(',')})
    )`)
    bindings.push(...filters.tag_ids)
  }

  return { conditions, bindings }
}

/**
 * Validate filters for server-side processing
 */
export function validateFiltersForExport(filters: QuoteExportFilters): FilterValidationResult {
  const result: FilterValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Validate date range
  if (filters.date_range?.start && filters.date_range?.end) {
    const startDate = new Date(filters.date_range.start)
    const endDate = new Date(filters.date_range.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      result.errors.push('Invalid date format. Use YYYY-MM-DD format.')
      result.valid = false
    } else if (startDate > endDate) {
      result.errors.push('Start date must be before end date')
      result.valid = false
    }
  }

  // Validate numeric filters
  if (filters.min_views !== undefined && (filters.min_views < 0 || !Number.isInteger(filters.min_views))) {
    result.errors.push('Minimum views must be a non-negative integer')
    result.valid = false
  }

  if (filters.min_likes !== undefined && (filters.min_likes < 0 || !Number.isInteger(filters.min_likes))) {
    result.errors.push('Minimum likes must be a non-negative integer')
    result.valid = false
  }

  // Validate ID filters
  const idFields = ['author_id', 'user_id', 'moderator_id'] as const
  for (const field of idFields) {
    if (filters[field] !== undefined && (filters[field]! <= 0 || !Number.isInteger(filters[field]!))) {
      result.errors.push(`${field} must be a positive integer`)
      result.valid = false
    }
  }

  // Validate tag IDs
  if (filters.tag_ids && (!Array.isArray(filters.tag_ids) || 
      !filters.tag_ids.every(id => Number.isInteger(id) && id > 0))) {
    result.errors.push('Tag IDs must be an array of positive integers')
    result.valid = false
  }

  // Performance warnings
  if (filters.search && filters.search.length < 3) {
    result.warnings.push('Short search terms may result in slower queries')
  }

  if (filters.tag_ids && filters.tag_ids.length > 10) {
    result.warnings.push('Large number of tag filters may impact performance')
  }

  return result
}

/**
 * Helper function to validate date format
 */
function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return false
  
  const date = new Date(dateStr + 'T00:00:00.000Z')
  return !isNaN(date.getTime())
}

/**
 * Serialize filters for database storage with validation
 */
export function serializeFiltersForStorage(filters: QuoteExportFilters): string {
  const validation = validateFiltersForExport(filters)
  
  if (!validation.valid) {
    throw new Error(`Cannot serialize invalid filters: ${validation.errors.join(', ')}`)
  }

  // Remove undefined and empty values
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && value.trim() === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      return true
    })
  )

  return JSON.stringify(cleanFilters)
}

/**
 * Validate filters for references export
 */
export function validateFiltersForReferencesExport(filters: ReferenceExportFilters): FilterValidationResult {
  const result: FilterValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Validate date range
  if (filters.date_range?.start && filters.date_range?.end) {
    const startDate = new Date(filters.date_range.start)
    const endDate = new Date(filters.date_range.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      result.errors.push('Invalid date format. Use YYYY-MM-DD format.')
      result.valid = false
    } else if (startDate > endDate) {
      result.errors.push('Start date must be before end date')
      result.valid = false
    }
  }

  // Validate release date range
  if (filters.release_date_range?.start && filters.release_date_range?.end) {
    const startDate = new Date(filters.release_date_range.start)
    const endDate = new Date(filters.release_date_range.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      result.errors.push('Invalid release date format. Use YYYY-MM-DD format.')
      result.valid = false
    } else if (startDate > endDate) {
      result.errors.push('Release start date must be before end date')
      result.valid = false
    }
  }

  // Validate numeric filters
  if (filters.min_views !== undefined && (filters.min_views < 0 || !Number.isInteger(filters.min_views))) {
    result.errors.push('Minimum views must be a non-negative integer')
    result.valid = false
  }

  if (filters.min_quotes !== undefined && (filters.min_quotes < 0 || !Number.isInteger(filters.min_quotes))) {
    result.errors.push('Minimum quotes must be a non-negative integer')
    result.valid = false
  }

  // Validate primary type filter
  if (filters.primary_type) {
    const validTypes = ['book', 'film', 'tv_series', 'music', 'other']
    const types = Array.isArray(filters.primary_type) ? filters.primary_type : [filters.primary_type]

    for (const type of types) {
      if (!validTypes.includes(type)) {
        result.errors.push(`Invalid primary type: ${type}. Valid types: ${validTypes.join(', ')}`)
        result.valid = false
      }
    }
  }

  // Performance warnings
  if (filters.search && filters.search.length < 3) {
    result.warnings.push('Short search terms may result in slower queries')
  }

  return result
}

/**
 * Validate filters for authors export
 */
export function validateFiltersForAuthorsExport(filters: AuthorExportFilters): FilterValidationResult {
  const result: FilterValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Validate date ranges
  if (filters.date_range?.start && filters.date_range?.end) {
    const startDate = new Date(filters.date_range.start)
    const endDate = new Date(filters.date_range.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      result.errors.push('Invalid date format. Use YYYY-MM-DD format.')
      result.valid = false
    } else if (startDate > endDate) {
      result.errors.push('Creation date range start must be before end date')
      result.valid = false
    }
  }

  if (filters.birth_date_range?.start && filters.birth_date_range?.end) {
    const startDate = new Date(filters.birth_date_range.start)
    const endDate = new Date(filters.birth_date_range.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      result.errors.push('Invalid birth date format. Use YYYY-MM-DD format.')
      result.valid = false
    } else if (startDate > endDate) {
      result.errors.push('Birth date range start must be before end date')
      result.valid = false
    }
  }

  if (filters.death_date_range?.start && filters.death_date_range?.end) {
    const startDate = new Date(filters.death_date_range.start)
    const endDate = new Date(filters.death_date_range.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      result.errors.push('Invalid death date format. Use YYYY-MM-DD format.')
      result.valid = false
    } else if (startDate > endDate) {
      result.errors.push('Death date range start must be before end date')
      result.valid = false
    }
  }

  // Validate numeric filters
  if (filters.min_views !== undefined && (filters.min_views < 0 || !Number.isInteger(filters.min_views))) {
    result.errors.push('Minimum views must be a non-negative integer')
    result.valid = false
  }

  if (filters.min_likes !== undefined && (filters.min_likes < 0 || !Number.isInteger(filters.min_likes))) {
    result.errors.push('Minimum likes must be a non-negative integer')
    result.valid = false
  }

  if (filters.min_quotes !== undefined && (filters.min_quotes < 0 || !Number.isInteger(filters.min_quotes))) {
    result.errors.push('Minimum quotes must be a non-negative integer')
    result.valid = false
  }

  // Performance warnings
  if (filters.search && filters.search.length < 3) {
    result.warnings.push('Short search terms may result in slower queries')
  }

  // Authors-specific warnings
  if (filters.birth_date_range?.start || filters.death_date_range?.start) {
    result.warnings.push('Date range filters on birth/death dates may exclude authors with missing date information')
  }

  if (filters.is_fictional !== undefined) {
    const typeLabel = filters.is_fictional ? 'fictional characters' : 'real people'
    result.warnings.push(`Export filtered to include only ${typeLabel}`)
  }

  return result
}
