/**
 * Admin API: Validate Quotes Export
 * Provides preview and validation for quotes export with filtering
 */

import { sql } from "drizzle-orm"

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

    // Validate filters using type-safe validation
    // The incoming `filters` may be a union (UI can send different shapes). Convert/sanitize
    // to the quote-specific structure we expect for validation and queries.
    const quoteFilters = sanitizeFiltersForQuery(filters as any)
    const filterValidation = validateFiltersForExport(quoteFilters)
    if (!filterValidation.valid) {
      validation.errors.push(...filterValidation.errors)
      validation.valid = false
    }
    validation.warnings.push(...filterValidation.warnings)

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

    // Build count query to estimate records using type-safe filter conditions
    const { conditions, bindings } = buildFilterConditions(quoteFilters)

    let countQuery = db.select({ total: sql<number>`COUNT(DISTINCT ${schema.quotes.id})` })
      .from(schema.quotes)
      .leftJoin(schema.authors, sql`${schema.quotes.authorId} = ${schema.authors.id}`)
      .leftJoin(schema.quoteReferences, sql`${schema.quotes.referenceId} = ${schema.quoteReferences.id}`)
      .leftJoin(schema.users, sql`${schema.quotes.userId} = ${schema.users.id}`);

    // Apply filters (this is simplified - the actual filter building logic should be in utility)
    
    try {
      const countResult = await countQuery;
      const totalCount = Number(countResult[0]?.total) || 0;
      
      // Apply limit if specified
      const estimatedCount = limit > 0 ? Math.min(totalCount, limit) : totalCount
      validation.estimated_count = estimatedCount

      // Estimate file size based on format and record count
      validation.estimated_size = estimateFileSize(format, estimatedCount, body.include_relations || false)

      // Add warnings based on estimates
      if (estimatedCount > 10000) {
        validation.warnings.push(`Large export detected (${estimatedCount.toLocaleString()} records). Consider using filters to reduce the dataset.`)
      }

      if (validation.estimated_size > 50 * 1024 * 1024) { // 50MB
        validation.warnings.push(`Large file size estimated (${formatFileSize(validation.estimated_size)}). Export may take several minutes.`)
      }

      if (estimatedCount === 0) {
        validation.warnings.push('No records match the current filters. Export will be empty.')
      }

      // Check for potentially slow queries
      if (filters.search && filters.search.length < 3) {
        validation.warnings.push('Short search terms may result in slower exports. Consider using longer, more specific search terms.')
      }

    } catch (error) {
      console.error('Failed to estimate export size:', error)
      validation.warnings.push('Unable to estimate export size. Proceeding with export may take longer than expected.')
    }

    return {
      success: true,
      data: validation
    }

  } catch (error: any) {
    console.error('Quotes export validation error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to validate quotes export'
    })
  }
})



/**
 * Estimate file size based on format and record count
 */
function estimateFileSize(format: string, recordCount: number, includeRelations: boolean): number {
  if (recordCount === 0) return 0

  // Base size per record (in bytes)
  let baseSize = 200 // Basic quote data

  if (includeRelations) {
    baseSize += 150 // Author data
    baseSize += 100 // Reference data
    baseSize += 50  // User data
    baseSize += 100 // Tags data
  }

  // Format multipliers
  const formatMultipliers = {
    json: 1.2, // JSON has some overhead with field names and formatting
    csv: 0.8,  // CSV is more compact
    xml: 1.8   // XML has significant tag overhead
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
