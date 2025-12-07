/**
 * Export Filter Utilities
 * Provides type-safe parsing, validation, and transformation of export filters
 */

import type { 
  QuoteExportFilters, 
  RawExportFilters, 
  FilterValidationResult,
  FilterTransformOptions,
  ExportLogEntry,
  ParsedExportLog
} from '~/types/export'
import { isQuoteStatus, isQuoteLanguage } from '~/types/export'

/**
 * Parse and sanitize raw filters from database JSON
 */
export function parseExportFilters(
  rawFilters: string | RawExportFilters | null | undefined
): QuoteExportFilters {
  if (!rawFilters) {
    return {}
  }

  let parsed: RawExportFilters
  
  try {
    if (typeof rawFilters === 'string') {
      parsed = JSON.parse(rawFilters) as RawExportFilters
    } else {
      parsed = rawFilters
    }
  } catch (error) {
    console.warn('Failed to parse export filters:', error)
    return {}
  }

  return sanitizeExportFilters(parsed)
}

/**
 * Convert raw filters to typed filters with proper type conversion
 */
export function sanitizeExportFilters(rawFilters: RawExportFilters): QuoteExportFilters {
  const sanitized: QuoteExportFilters = {}

  // Handle status filter
  if (rawFilters.status !== undefined) {
    if (Array.isArray(rawFilters.status)) {
      const validStatuses = rawFilters.status.filter(isQuoteStatus)
      if (validStatuses.length > 0) {
        sanitized.status = validStatuses
      }
    } else if (isQuoteStatus(rawFilters.status)) {
      sanitized.status = rawFilters.status
    }
  }

  // Handle language filter
  if (rawFilters.language !== undefined) {
    if (Array.isArray(rawFilters.language)) {
      const validLanguages = rawFilters.language.filter(isQuoteLanguage)
      if (validLanguages.length > 0) {
        sanitized.language = validLanguages
      }
    } else if (isQuoteLanguage(rawFilters.language)) {
      sanitized.language = rawFilters.language
    }
  }

  // Handle numeric filters with proper conversion
  if (rawFilters.author_id !== undefined) {
    const authorId = typeof rawFilters.author_id === 'string' 
      ? parseInt(rawFilters.author_id, 10) 
      : rawFilters.author_id
    if (!isNaN(authorId) && authorId > 0) {
      sanitized.author_id = authorId
    }
  }

  if (rawFilters.user_id !== undefined) {
    const userId = typeof rawFilters.user_id === 'string' 
      ? parseInt(rawFilters.user_id, 10) 
      : rawFilters.user_id
    if (!isNaN(userId) && userId > 0) {
      sanitized.user_id = userId
    }
  }

  if (rawFilters.moderator_id !== undefined) {
    const moderatorId = typeof rawFilters.moderator_id === 'string' 
      ? parseInt(rawFilters.moderator_id, 10) 
      : rawFilters.moderator_id
    if (!isNaN(moderatorId) && moderatorId > 0) {
      sanitized.moderator_id = moderatorId
    }
  }

  if (rawFilters.min_views !== undefined) {
    const minViews = typeof rawFilters.min_views === 'string' 
      ? parseInt(rawFilters.min_views, 10) 
      : rawFilters.min_views
    if (!isNaN(minViews) && minViews >= 0) {
      sanitized.min_views = minViews
    }
  }

  if (rawFilters.min_likes !== undefined) {
    const minLikes = typeof rawFilters.min_likes === 'string' 
      ? parseInt(rawFilters.min_likes, 10) 
      : rawFilters.min_likes
    if (!isNaN(minLikes) && minLikes >= 0) {
      sanitized.min_likes = minLikes
    }
  }

  // Handle tag IDs array
  if (rawFilters.tag_ids && Array.isArray(rawFilters.tag_ids)) {
    const validTagIds = rawFilters.tag_ids
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id) && id > 0)
    if (validTagIds.length > 0) {
      sanitized.tag_ids = validTagIds
    }
  }

  // Handle string filters
  if (rawFilters.author_name && typeof rawFilters.author_name === 'string') {
    const trimmed = rawFilters.author_name.trim()
    if (trimmed.length > 0) {
      sanitized.author_name = trimmed
    }
  }

  if (rawFilters.search && typeof rawFilters.search === 'string') {
    const trimmed = rawFilters.search.trim()
    if (trimmed.length > 0) {
      sanitized.search = trimmed
    }
  }

  // Handle boolean filters
  if (rawFilters.featured_only !== undefined) {
    if (typeof rawFilters.featured_only === 'boolean') {
      sanitized.featured_only = rawFilters.featured_only
    } else if (typeof rawFilters.featured_only === 'string') {
      sanitized.featured_only = rawFilters.featured_only === 'true'
    }
  }

  // Handle date range
  if (rawFilters.date_range && typeof rawFilters.date_range === 'object') {
    const dateRange: { start?: string; end?: string } = {}
    
    if (rawFilters.date_range.start && typeof rawFilters.date_range.start === 'string') {
      const trimmed = rawFilters.date_range.start.trim()
      if (trimmed.length > 0 && isValidDateString(trimmed)) {
        dateRange.start = trimmed
      }
    }
    
    if (rawFilters.date_range.end && typeof rawFilters.date_range.end === 'string') {
      const trimmed = rawFilters.date_range.end.trim()
      if (trimmed.length > 0 && isValidDateString(trimmed)) {
        dateRange.end = trimmed
      }
    }
    
    if (dateRange.start || dateRange.end) {
      sanitized.date_range = dateRange
    }
  }

  return sanitized
}

/**
 * Validate export filters
 */
export function validateExportFilters(
  filters: QuoteExportFilters | RawExportFilters
): FilterValidationResult {
  const result: FilterValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // If raw filters, sanitize first
  const sanitizedFilters = 'status' in filters && typeof filters.status === 'object' 
    ? sanitizeExportFilters(filters as RawExportFilters)
    : filters as QuoteExportFilters

  // Validate date range
  if (sanitizedFilters.date_range) {
    const { start, end } = sanitizedFilters.date_range
    
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      
      if (startDate > endDate) {
        result.errors.push('Start date must be before end date')
        result.valid = false
      }
      
      const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 365) {
        result.warnings.push('Date range spans more than 1 year. This may result in a large export.')
      }
    }
  }

  // Validate numeric filters
  if (sanitizedFilters.min_views !== undefined && sanitizedFilters.min_views < 0) {
    result.errors.push('Minimum views must be 0 or greater')
    result.valid = false
  }

  if (sanitizedFilters.min_likes !== undefined && sanitizedFilters.min_likes < 0) {
    result.errors.push('Minimum likes must be 0 or greater')
    result.valid = false
  }

  // Validate search term length
  if (sanitizedFilters.search && sanitizedFilters.search.length < 2) {
    result.warnings.push('Short search terms may result in slower exports')
  }

  // Set sanitized filters if validation passed
  if (result.valid) {
    result.sanitized = sanitizedFilters
  }

  return result
}

/**
 * Serialize filters for database storage
 */
export function serializeExportFilters(filters: QuoteExportFilters): string {
  // Remove undefined and empty values before serialization
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
 * Parse export log entry with typed filters
 */
export function parseExportLogEntry(logEntry: ExportLogEntry): ParsedExportLog {
  const filters = parseExportFilters(logEntry.filters_applied)
  
  return {
    ...logEntry,
    filters,
    filters_applied: logEntry.filters_applied
  }
}

/**
 * Helper function to validate date string format (YYYY-MM-DD)
 */
function isValidDateString(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return false
  
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Transform filters with options
 */
export function transformExportFilters(
  filters: QuoteExportFilters,
  options: FilterTransformOptions = {}
): QuoteExportFilters {
  const { includeEmpty = false, validate = true } = options

  let result = { ...filters }

  if (!includeEmpty) {
    // Remove empty values
    result = Object.fromEntries(
      Object.entries(result).filter(([_, value]) => {
        if (value === undefined || value === null) return false
        if (typeof value === 'string' && value.trim() === '') return false
        if (Array.isArray(value) && value.length === 0) return false
        return true
      })
    ) as QuoteExportFilters
  }

  if (validate) {
    const validation = validateExportFilters(result)
    if (!validation.valid && options.throwOnError) {
      throw new Error(`Filter validation failed: ${validation.errors.join(', ')}`)
    }
    if (validation.sanitized) {
      result = validation.sanitized
    }
  }

  return result
}
