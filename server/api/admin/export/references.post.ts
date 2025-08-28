import type { ExportOptions, ReferenceExportFilters, ExportResult, ExportedReference } from '~/types/export'

/**
 * Admin API: Export References Data
 * Comprehensive references export with filtering, multiple formats, and progress tracking
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event) as ExportOptions
    const { format, filters = {}, include_relations = true, include_metadata = false, limit = 0 } = body

    const filterValidation = validateFiltersForReferencesExport(filters as ReferenceExportFilters)
    if (!filterValidation.valid) {
      throw createError({ statusCode: 400, statusMessage: `Invalid filters: ${filterValidation.errors.join(', ')}` })
    }

    if (!format) {
      throw createError({ statusCode: 400, statusMessage: 'Export format is required' })
    }

    if (!['json', 'csv', 'xml'].includes(format)) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported export format. Supported formats: json, csv, xml' })
    }

    const db = hubDatabase()
    const exportId = `references_export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const { query, bindings } = buildReferencesQuery(filters as ReferenceExportFilters, include_relations, limit)
    const referencesResult = await db.prepare(query).bind(...bindings).all()
    const references = (referencesResult?.results || []) as any[]

    const processedReferences: ExportedReference[] = references.map((reference: any) => {
      const processed: ExportedReference = {
        id: reference.id,
        name: reference.name,
        primary_type: reference.primary_type,
        secondary_type: reference.secondary_type || undefined,
        description: reference.description || undefined,
        release_date: reference.release_date || undefined,
        image_url: reference.image_url || undefined,
        views_count: reference.views_count || 0,
        likes_count: reference.likes_count || 0,
        created_at: reference.created_at,
        updated_at: reference.updated_at
      }

      if (reference.urls) {
        try { processed.urls = JSON.parse(reference.urls) } 
        catch { processed.urls = [reference.urls] } // Keep as string if parsing fails
      }

      if (include_relations && reference.quotes_count !== undefined) {
        processed.quotes_count = reference.quotes_count
      }

      if (include_metadata) {
        processed._metadata = {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          export_id: exportId,
          export_filters: filters as ReferenceExportFilters
        }
      }

      return processed
    })

    // Generate export content based on format
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `references-export-${timestamp}.${format}`
    let contentData: string
    let mimeType: string

    switch (format) {
      case 'json':
        contentData = JSON.stringify(processedReferences, null, 2)
        mimeType = 'application/json'
        break

      case 'csv':
        contentData = generateReferencesCSV(processedReferences)
        mimeType = 'text/csv'
        break

      case 'xml':
        contentData = generateReferencesXML(processedReferences)
        mimeType = 'application/xml'
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported export format'
        })
    }

    await logReferencesExport(db, {
      exportId,
      filename,
      format,
      filters: serializeReferencesFilters(filters as ReferenceExportFilters),
      recordCount: processedReferences.length,
      userId: user.id,
      includeRelations: include_relations,
      includeMetadata: include_metadata
    })

    const result: ExportResult = {
      success: true,
      data: {
        export_id: exportId,
        filename,
        format,
        record_count: processedReferences.length,
        file_size: Buffer.byteLength(contentData, 'utf8'),
        download_url: `/api/admin/export/download/${exportId}`,
        options: body,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        // Include content directly for small exports
        content: processedReferences.length < 1000 ? contentData : undefined,
        mimeType
      }
    }

    return result

  } catch (error: any) {
    console.error('References export failed:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'References export failed'
    })
  }
})

/**
 * Validate filters for references export
 */
function validateFiltersForReferencesExport(filters: ReferenceExportFilters) {
  const validation = {
    valid: true,
    errors: [] as string[]
  }

  // Validate primary_type
  if (filters.primary_type) {
    const validTypes = ['book', 'film', 'tv_series', 'music', 'other']
    const types = Array.isArray(filters.primary_type) ? filters.primary_type : [filters.primary_type]
    
    for (const type of types) {
      if (!validTypes.includes(type)) {
        validation.errors.push(`Invalid primary_type: ${type}`)
        validation.valid = false
      }
    }
  }

  // Validate numeric filters
  if (filters.min_views !== undefined && (filters.min_views < 0 || !Number.isInteger(filters.min_views))) {
    validation.errors.push('min_views must be a non-negative integer')
    validation.valid = false
  }

  if (filters.min_quotes !== undefined && (filters.min_quotes < 0 || !Number.isInteger(filters.min_quotes))) {
    validation.errors.push('min_quotes must be a non-negative integer')
    validation.valid = false
  }

  return validation
}

/**
 * Build SQL query for references export with filters
 */
function buildReferencesQuery(filters: ReferenceExportFilters, includeRelations: boolean, limit: number) {
  // Base query
  let query = `
    SELECT 
      r.*
      ${includeRelations ? `, COUNT(q.id) as quotes_count` : ''}
    FROM quote_references r
    ${includeRelations ? `LEFT JOIN quotes q ON r.id = q.reference_id AND q.status = 'approved'` : ''}
  `

  const conditions: string[] = []
  const bindings: any[] = []

  // Apply filters
  if (filters.primary_type) {
    const types = Array.isArray(filters.primary_type) ? filters.primary_type : [filters.primary_type]
    const placeholders = types.map(() => '?').join(',')
    conditions.push(`r.primary_type IN (${placeholders})`)
    bindings.push(...types)
  }

  if (filters.secondary_type) {
    const types = Array.isArray(filters.secondary_type) ? filters.secondary_type : [filters.secondary_type]
    const placeholders = types.map(() => '?').join(',')
    conditions.push(`r.secondary_type IN (${placeholders})`)
    bindings.push(...types)
  }

  if (filters.search && filters.search.trim()) {
    conditions.push('r.name LIKE ?')
    bindings.push(`%${filters.search.trim()}%`)
  }

  if (filters.date_range?.start && filters.date_range.start.trim()) {
    conditions.push('r.created_at >= ?')
    bindings.push(filters.date_range.start)
  }

  if (filters.date_range?.end && filters.date_range.end.trim()) {
    conditions.push('r.created_at <= ?')
    bindings.push(filters.date_range.end)
  }

  if (filters.release_date_range?.start && filters.release_date_range.start.trim()) {
    conditions.push('r.release_date >= ?')
    bindings.push(filters.release_date_range.start)
  }

  if (filters.release_date_range?.end && filters.release_date_range.end.trim()) {
    conditions.push('r.release_date <= ?')
    bindings.push(filters.release_date_range.end)
  }

  if (filters.min_views !== undefined && filters.min_views > 0) {
    conditions.push('r.views_count >= ?')
    bindings.push(filters.min_views)
  }

  // Add WHERE clause if we have conditions
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  // Add GROUP BY for relations
  if (includeRelations) {
    query += ' GROUP BY r.id'
    
    // Add HAVING clause for min_quotes filter
    if (filters.min_quotes !== undefined && filters.min_quotes > 0) {
      query += ' HAVING quotes_count >= ?'
      bindings.push(filters.min_quotes)
    }
  }

  // Add ORDER BY
  query += ' ORDER BY r.created_at DESC'

  // Add LIMIT if specified
  if (limit > 0) {
    query += ' LIMIT ?'
    bindings.push(limit)
  }

  return { query, bindings }
}

/**
 * Generate CSV content for references
 */
function generateReferencesCSV(references: ExportedReference[]): string {
  if (references.length === 0) return ''

  const headers = [
    'id', 'name', 'primary_type', 'secondary_type', 'description', 'release_date',
    'image_url', 'urls', 'views_count', 'likes_count', 'quotes_count', 'created_at', 'updated_at'
  ]

  const csvRows = [
    headers.join(','), // Header row
    ...references.map(reference => {
      const row = [
        reference.id,
        `"${(reference.name || '').replace(/"/g, '""')}"`,
        reference.primary_type,
        reference.secondary_type || '',
        `"${(reference.description || '').replace(/"/g, '""')}"`,
        reference.release_date || '',
        reference.image_url || '',
        reference.urls ? `"${JSON.stringify(reference.urls).replace(/"/g, '""')}"` : '',
        reference.views_count,
        reference.likes_count,
        reference.quotes_count || '',
        reference.created_at,
        reference.updated_at
      ]
      return row.join(',')
    })
  ]

  return csvRows.join('\n')
}

/**
 * Generate XML content for references
 */
function generateReferencesXML(references: ExportedReference[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const rootStart = '<references>'
  const rootEnd = '</references>'

  const xmlContent = references.map(reference => {
    const urls = reference.urls ? reference.urls.map(url => `<url>${escapeXml(url)}</url>`).join('') : ''

    return `
  <reference>
    <id>${reference.id}</id>
    <name>${escapeXml(reference.name)}</name>
    <primary_type>${escapeXml(reference.primary_type)}</primary_type>
    <secondary_type>${escapeXml(reference.secondary_type || '')}</secondary_type>
    <description>${escapeXml(reference.description || '')}</description>
    <release_date>${escapeXml(reference.release_date || '')}</release_date>
    <image_url>${escapeXml(reference.image_url || '')}</image_url>
    <urls>${urls}</urls>
    <views_count>${reference.views_count}</views_count>
    <likes_count>${reference.likes_count}</likes_count>
    <quotes_count>${reference.quotes_count || 0}</quotes_count>
    <created_at>${escapeXml(reference.created_at)}</created_at>
    <updated_at>${escapeXml(reference.updated_at)}</updated_at>
  </reference>`
  }).join('')

  return `${xmlHeader}\n${rootStart}${xmlContent}\n${rootEnd}`
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Serialize reference filters for database storage
 */
function serializeReferencesFilters(filters: ReferenceExportFilters): string {
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
 * Log references export to database
 */
async function logReferencesExport(db: any, exportInfo: any) {
  try {
    await db.prepare(`
      INSERT INTO export_logs
      (export_id, filename, format, data_type, filters_applied, record_count, file_size, user_id, include_relations, include_metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      exportInfo.exportId,
      exportInfo.filename,
      exportInfo.format,
      'references',
      exportInfo.filters,
      exportInfo.recordCount,
      exportInfo.fileSize || null,
      exportInfo.userId,
      exportInfo.includeRelations,
      exportInfo.includeMetadata
    ).run()

  } catch (error) {
    console.error('Failed to log references export:', error)
    // Don't fail the export if logging fails
  }
}
