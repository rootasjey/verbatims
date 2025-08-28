import type { ExportOptions, AuthorExportFilters, ExportResult, ExportedAuthor, ExportResultWithBackup } from '~/types/export'

/**
 * Admin API: Export Authors Data
 * Comprehensive authors export with filtering, multiple formats, and progress tracking
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event) as ExportOptions
    const { format, filters = {}, include_relations = true, include_metadata = false, limit = 0 } = body

    const authorsFilters = filters as AuthorExportFilters
    const filterValidation = validateFiltersForAuthorsExport(authorsFilters)
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
    const uniqueExportId = `authors_export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const { query, bindings } = buildAuthorsQuery(authorsFilters, include_relations, limit)

    const authorsResult = await db.prepare(query).bind(...bindings).all()
    const authors = (authorsResult?.results || [])

    const processedAuthors: ExportedAuthor[] = authors.map((author: any) => {
      const processed: ExportedAuthor = {
        id: author.id,
        name: author.name,
        is_fictional: Boolean(author.is_fictional),
        birth_date: author.birth_date || undefined,
        birth_location: author.birth_location || undefined,
        death_date: author.death_date || undefined,
        death_location: author.death_location || undefined,
        job: author.job || undefined,
        description: author.description || undefined,
        image_url: author.image_url || undefined,
        views_count: author.views_count || 0,
        likes_count: author.likes_count || 0,
        shares_count: author.shares_count || 0,
        created_at: author.created_at,
        updated_at: author.updated_at
      }

      if (author.socials) {
        try { processed.socials = JSON.parse(author.socials) } 
        catch (error) {
          console.error('Failed to parse author socials:', error)
          processed.socials = []
        }
      }

      if (include_relations && author.quotes_count !== undefined) {
        processed.quotes_count = author.quotes_count
      }

      if (include_metadata) {
        processed._metadata = {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          export_id: uniqueExportId,
          export_filters: authorsFilters
        }
      }

      return processed
    })

    // Generate export content based on format
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `authors-export-${timestamp}.${format}`
    let contentData: string
    let mimeType: string

    switch (format) {
      case 'json':
        contentData = JSON.stringify(processedAuthors, null, 2)
        mimeType = 'application/json'
        break

      case 'csv':
        contentData = generateAuthorsCSV(processedAuthors)
        mimeType = 'text/csv'
        break

      case 'xml':
        contentData = generateAuthorsXML(processedAuthors)
        mimeType = 'application/xml'
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported export format'
        })
    }

    // Log the export first to get the export log ID
    const fileSize = new TextEncoder().encode(contentData).length
    const exportLogResult = await logAuthorsExport(db, {
      exportId: uniqueExportId,
      filename,
      format,
      filters: authorsFilters,
      recordCount: processedAuthors.length,
      userId: user.id,
      fileSize: fileSize
    })

    // Create backup in R2 storage
    let backupInfo = undefined

    try {
      const backupResult = await createBackup(
        db,
        contentData,
        filename,
        'authors',
        format,
        {
          exportLogId: exportLogResult.exportLogId,
          retentionDays: 90,
          metadata: {
            export_config: body,
            filters: authorsFilters,
            created_by: user.id,
            backup_type: 'export',
            data_type: 'authors'
          }
        }
      )

      backupInfo = {
        backup_id: backupResult.backupId,
        file_key: backupResult.fileKey,
        file_path: backupResult.filePath,
        storage_status: 'stored' as const,
        backup_download_url: `/api/admin/backup/download/${backupResult.backupId}`,
        retention_days: 90,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    } catch (backupError) {
      console.error('Failed to create backup, continuing with export:', backupError)
      // Don't fail the export if backup fails
    }

    const result: ExportResultWithBackup = {
      success: true,
      data: {
        export_id: uniqueExportId,
        filename,
        format,
        record_count: processedAuthors.length,
        file_size: fileSize,
        download_url: `/api/admin/export/download/${uniqueExportId}`,
        options: body,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      backup: backupInfo
    }

    // For smaller exports, still provide direct content for immediate download
    if (contentData.length < 5 * 1024 * 1024) { // Less than 5MB
      const resultData = result.data as any
      resultData.content = contentData
      resultData.mimeType = mimeType
    }

    return result

  } catch (error: any) {
    console.error('Authors export error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Export failed'
    })
  }
})

/**
 * Build SQL query for authors export with filters
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
 * Generate CSV format for authors export
 */
function generateAuthorsCSV(authors: ExportedAuthor[]): string {
  if (authors.length === 0) return ''

  // Define CSV headers
  const headers = [
    'id', 'name', 'is_fictional', 'birth_date', 'birth_location', 'death_date', 'death_location',
    'job', 'description', 'image_url', 'views_count', 'likes_count', 'shares_count',
    'quotes_count', 'socials', 'created_at', 'updated_at'
  ]

  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...authors.map(author => {
      const row = [
        author.id,
        `"${(author.name || '').replace(/"/g, '""')}"`,
        author.is_fictional,
        author.birth_date || '',
        `"${(author.birth_location || '').replace(/"/g, '""')}"`,
        author.death_date || '',
        `"${(author.death_location || '').replace(/"/g, '""')}"`,
        `"${(author.job || '').replace(/"/g, '""')}"`,
        `"${(author.description || '').replace(/"/g, '""')}"`,
        author.image_url || '',
        author.views_count,
        author.likes_count,
        author.shares_count,
        author.quotes_count || '',
        `"${author.socials ? JSON.stringify(author.socials).replace(/"/g, '""') : ''}"`,
        author.created_at,
        author.updated_at
      ]
      return row.join(',')
    })
  ]

  return csvRows.join('\n')
}

/**
 * Generate XML format for authors export
 */
function generateAuthorsXML(authors: ExportedAuthor[]): string {
  const escapeXml = (str: string) => {
    return str.replace(/[<>&'"]/g, (char) => {
      switch (char) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case "'": return '&apos;'
        case '"': return '&quot;'
        default: return char
      }
    })
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<authors>\n'

  authors.forEach(author => {
    xml += '  <author>\n'
    xml += `    <id>${author.id}</id>\n`
    xml += `    <name><![CDATA[${author.name}]]></name>\n`
    xml += `    <is_fictional>${author.is_fictional}</is_fictional>\n`

    if (author.birth_date) xml += `    <birth_date>${author.birth_date}</birth_date>\n`
    if (author.birth_location) xml += `    <birth_location><![CDATA[${author.birth_location}]]></birth_location>\n`
    if (author.death_date) xml += `    <death_date>${author.death_date}</death_date>\n`
    if (author.death_location) xml += `    <death_location><![CDATA[${author.death_location}]]></death_location>\n`
    if (author.job) xml += `    <job><![CDATA[${author.job}]]></job>\n`
    if (author.description) xml += `    <description><![CDATA[${author.description}]]></description>\n`
    if (author.image_url) xml += `    <image_url>${escapeXml(author.image_url)}</image_url>\n`

    xml += `    <views_count>${author.views_count}</views_count>\n`
    xml += `    <likes_count>${author.likes_count}</likes_count>\n`
    xml += `    <shares_count>${author.shares_count}</shares_count>\n`

    if (author.quotes_count !== undefined) {
      xml += `    <quotes_count>${author.quotes_count}</quotes_count>\n`
    }

    if (author.socials && author.socials.length > 0) {
      xml += '    <socials>\n'
      author.socials.forEach(social => {
        xml += '      <social>\n'
        xml += `        <platform><![CDATA[${social.platform}]]></platform>\n`
        xml += `        <url>${escapeXml(social.url)}</url>\n`
        if (social.username) xml += `        <username><![CDATA[${social.username}]]></username>\n`
        xml += '      </social>\n'
      })
      xml += '    </socials>\n'
    }

    xml += `    <created_at>${author.created_at}</created_at>\n`
    xml += `    <updated_at>${author.updated_at}</updated_at>\n`

    if (author._metadata) {
      xml += '    <metadata>\n'
      xml += `      <exported_at>${author._metadata.exported_at}</exported_at>\n`
      xml += `      <exported_by>${author._metadata.exported_by}</exported_by>\n`
      xml += `      <export_id>${author._metadata.export_id}</export_id>\n`
      xml += '    </metadata>\n'
    }

    xml += '  </author>\n'
  })

  xml += '</authors>'
  return xml
}

/**
 * Log authors export to database
 */
async function logAuthorsExport(db: any, exportInfo: {
  exportId: string
  filename: string
  format: string
  filters: AuthorExportFilters
  recordCount: number
  userId: number
  fileSize: number
  includeRelations?: boolean
  includeMetadata?: boolean
}): Promise<{ exportLogId: number }> {
  try {
    const result = await db.prepare(`
      INSERT INTO export_logs (export_id, filename, format, data_type, filters_applied, record_count, file_size, user_id, include_relations, include_metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      exportInfo.exportId,
      exportInfo.filename,
      exportInfo.format,
      'authors',
      JSON.stringify(exportInfo.filters),
      exportInfo.recordCount,
      exportInfo.fileSize,
      exportInfo.userId,
      exportInfo.includeRelations || false,
      exportInfo.includeMetadata || false
    ).run()

    return { exportLogId: result.meta.last_row_id }

  } catch (error) {
    console.error('Failed to log authors export:', error)
    // Return a fallback ID if logging fails
    return { exportLogId: 0 }
  }
}

/**
 * Validate filters for authors export
 */
function validateFiltersForAuthorsExport(filters: AuthorExportFilters) {
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

  if (filters.birth_date_range?.start && filters.birth_date_range?.end) {
    if (new Date(filters.birth_date_range.start) > new Date(filters.birth_date_range.end)) {
      validation.errors.push('Birth date range start must be before end date')
      validation.valid = false
    }
  }

  if (filters.death_date_range?.start && filters.death_date_range?.end) {
    if (new Date(filters.death_date_range.start) > new Date(filters.death_date_range.end)) {
      validation.errors.push('Death date range start must be before end date')
      validation.valid = false
    }
  }

  // Validate numeric filters
  if (filters.min_views !== undefined && filters.min_views < 0) {
    validation.errors.push('Minimum views count must be non-negative')
    validation.valid = false
  }

  if (filters.min_likes !== undefined && filters.min_likes < 0) {
    validation.errors.push('Minimum likes count must be non-negative')
    validation.valid = false
  }

  if (filters.min_quotes !== undefined && filters.min_quotes < 0) {
    validation.errors.push('Minimum quotes count must be non-negative')
    validation.valid = false
  }

  return validation
}
