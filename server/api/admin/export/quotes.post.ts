import type {
  DatabaseAdminQuote,
  ExportOptions,
  QuoteExportFilters,
  ExportedQuote,
  ExportResultWithBackup,
} from '~/types'

/**
 * Admin API: Export Quotes Data
 * Comprehensive quotes export with filtering, multiple formats, and progress tracking
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin' && user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event) as ExportOptions
    const {
      format,
      filters = {},
      include_relations = true,
      include_metadata = false,
      limit = 0
    } = body

    const quotesFilters = filters as QuoteExportFilters
    const filterValidation = validateFiltersForExport(quotesFilters)
    if (!filterValidation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid filters: ${filterValidation.errors.join(', ')}`
      })
    }

    if (!format) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Export format is required'
      })
    }

    if (!['json', 'csv', 'xml'].includes(format)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported export format. Supported formats: json, csv, xml'
      })
    }

    const db = hubDatabase()
    const uniqueExportId = `quotes_export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const { query, bindings } = buildQuotesQuery(quotesFilters, include_relations, limit)
    const quotesResult = await db.prepare(query).bind(...bindings).all()
    const quotes = (quotesResult?.results || []) as unknown as DatabaseAdminQuote[]

    const processedQuotes: ExportedQuote[] = quotes.map((quote) => {
      const processed: ExportedQuote = {
        id: quote.id,
        name: quote.name,
        language: quote.language,
        status: quote.status,
        views_count: quote.views_count || 0,
        likes_count: quote.likes_count || 0,
        shares_count: quote.shares_count || 0,
        is_featured: Boolean(quote.is_featured),
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        moderated_at: quote.moderated_at || undefined,
        rejection_reason: quote.rejection_reason || undefined
      }

      if (include_relations) {
        if (quote.author_name) {
          processed.author = {
            id: quote.author_id ?? -1,
            name: quote.author_name,
            is_fictional: Boolean(quote.author_is_fictional),
            job: quote.author_job,
            birth_date: quote.author_birth_date,
            death_date: quote.author_death_date,
            image_url: quote.author_image_url
          }
        }

        if (quote.reference_name) {
          processed.reference = {
            id: quote.reference_id ?? -1,
            name: quote.reference_name,
            primary_type: quote.reference_type || 'other',
            secondary_type: quote.reference_secondary_type || undefined,
            release_date: quote.reference_release_date || undefined,
            description: quote.reference_description || undefined,
            image_url: quote.reference_image_url || undefined
          }
        }

        if (quote.user_name) {
          processed.user = {
            id: quote.user_id,
            name: quote.user_name,
            email: body.include_user_data ? quote.user_email : undefined
          }
        }

        if (quote.moderator_name) {
          processed.moderator = {
            id: quote.moderator_id ?? -1,
            name: quote.moderator_name
          }
        }

        if (quote.tag_names) {
          const tagNames = quote.tag_names.split(',')
          const tagColors = quote.tag_colors ? quote.tag_colors.split(',') : []
          const tagIds = quote.tag_ids ? quote.tag_ids.split(',').map(Number) : []
          
          processed.tags = tagNames.map((name: string, index: number) => ({
            id: tagIds[index] || 0,
            name: name.trim(),
            color: tagColors[index] || 'gray'
          }))
        }
      }

      if (include_metadata) {
        processed._metadata = {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          export_id: uniqueExportId,
          export_filters: quotesFilters
        }
      }

      return processed
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `quotes-export-${timestamp}.${format}`
    let contentData: string
    let mimeType: string

    switch (format) {
      case 'json':
        contentData = JSON.stringify(processedQuotes, null, 2)
        mimeType = 'application/json'
        break

      case 'csv':
        contentData = generateQuotesCSV(processedQuotes)
        mimeType = 'text/csv'
        break

      case 'xml':
        contentData = generateQuotesXML(processedQuotes)
        mimeType = 'application/xml'
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported export format'
        })
    }

    const fileSize: number = new TextEncoder().encode(contentData).length
    const { exportLogId } = await logQuotesExport(db, {
      exportId: uniqueExportId,
      filename,
      format,
      filters: quotesFilters,
      recordCount: processedQuotes.length,
      userId: user.id,
      fileSize: fileSize
    })

    const backupResult = await createBackup(
      db,
      contentData,
      filename,
      'quotes',
      format,
      {
        exportLogId: exportLogId,
        retentionDays: 90,
        metadata: {
          export_config: body,
          filters: quotesFilters,
          created_by: user.id,
          backup_type: 'export',
          data_type: 'quotes'
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
        export_id: uniqueExportId,
        filename,
        format,
        record_count: processedQuotes.length,
        file_size: fileSize,
        download_url: `/api/admin/export/download/${uniqueExportId}`,
        options: body,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      backup: backupInfo
    }

    // For smaller exports, still provide direct content for immediate download
    if (contentData.length < 5 * 1024 * 1024) { // Less than 5MB (reduced from 10MB)
      const resultData = result.data as any
      resultData.content = contentData
      resultData.mimeType = mimeType
    }

    return result

  } catch (error: any) {
    console.error('Quotes export error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Export failed'
    })
  }
})

/**
 * Build SQL query for quotes export with filters
 */
function buildQuotesQuery(filters: QuoteExportFilters, includeRelations: boolean, limit: number) {
  let baseQuery = `
    SELECT
      q.*${includeRelations ? `,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.job as author_job,
        a.birth_date as author_birth_date,
        a.death_date as author_death_date,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        r.secondary_type as reference_secondary_type,
        r.release_date as reference_release_date,
        r.description as reference_description,
        r.image_url as reference_image_url,
        u.name as user_name,
        u.email as user_email,
        m.name as moderator_name,
        GROUP_CONCAT(DISTINCT t.id) as tag_ids,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT t.color) as tag_colors
      ` : ''}
    FROM quotes q
    ${includeRelations ? `
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN users m ON q.moderator_id = m.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
    ` : ''}
  `

  const { conditions, bindings } = buildFilterConditions(filters)

  if (conditions.length > 0) { baseQuery += ` WHERE ${conditions.join(' AND ')}` }
  if (includeRelations) { baseQuery += ' GROUP BY q.id' }

  baseQuery += ' ORDER BY q.created_at DESC'

  if (limit > 0) {
    baseQuery += ' LIMIT ?'
    bindings.push(limit)
  }

  return { query: baseQuery, bindings }
}

/**
 * Generate CSV format for quotes export
 */
function generateQuotesCSV(quotes: ExportedQuote[]): string {
  if (quotes.length === 0) return ''

  const headers = [
    'id', 'name', 'language', 'status', 'views_count', 'likes_count', 'shares_count',
    'is_featured', 'created_at', 'updated_at', 'moderated_at', 'rejection_reason',
    'author_id', 'author_name', 'author_is_fictional', 'author_job', 'author_birth_date', 'author_death_date',
    'reference_id', 'reference_name', 'reference_type', 'reference_secondary_type', 'reference_release_date',
    'user_id', 'user_name', 'user_email', 'moderator_id', 'moderator_name', 'tags'
  ]

  const csvRows = [
    headers.join(','), // Header row
    ...quotes.map(quote => {
      const row = [
        quote.id,
        `"${(quote.name || '').replace(/"/g, '""')}"`,
        quote.language,
        quote.status,
        quote.views_count,
        quote.likes_count,
        quote.shares_count,
        quote.is_featured,
        quote.created_at,
        quote.updated_at,
        quote.moderated_at || '',
        `"${(quote.rejection_reason || '').replace(/"/g, '""')}"`,
        quote.author?.id || '',
        `"${(quote.author?.name || '').replace(/"/g, '""')}"`,
        quote.author?.is_fictional || '',
        `"${(quote.author?.job || '').replace(/"/g, '""')}"`,
        quote.author?.birth_date || '',
        quote.author?.death_date || '',
        quote.reference?.id || '',
        `"${(quote.reference?.name || '').replace(/"/g, '""')}"`,
        quote.reference?.primary_type || '',
        quote.reference?.secondary_type || '',
        quote.reference?.release_date || '',
        quote.user?.id || '',
        `"${(quote.user?.name || '').replace(/"/g, '""')}"`,
        `"${(quote.user?.email || '').replace(/"/g, '""')}"`,
        quote.moderator?.id || '',
        `"${(quote.moderator?.name || '').replace(/"/g, '""')}"`,
        `"${quote.tags?.map(t => t.name).join('; ') || ''}"`
      ]

      return row.join(',')
    })
  ]

  return csvRows.join('\n')
}

/**
 * Generate XML format for quotes export
 */
function generateQuotesXML(quotes: ExportedQuote[]): string {
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
  xml += '<quotes>\n'

  quotes.forEach(quote => {
    xml += '  <quote>\n'
    xml += `    <id>${quote.id}</id>\n`
    xml += `    <name><![CDATA[${quote.name}]]></name>\n`
    xml += `    <language>${quote.language}</language>\n`
    xml += `    <status>${quote.status}</status>\n`
    xml += `    <views_count>${quote.views_count}</views_count>\n`
    xml += `    <likes_count>${quote.likes_count}</likes_count>\n`
    xml += `    <shares_count>${quote.shares_count}</shares_count>\n`
    xml += `    <is_featured>${quote.is_featured}</is_featured>\n`
    xml += `    <created_at>${quote.created_at}</created_at>\n`
    xml += `    <updated_at>${quote.updated_at}</updated_at>\n`

    if (quote.moderated_at) {
      xml += `    <moderated_at>${quote.moderated_at}</moderated_at>\n`
    }

    if (quote.rejection_reason) {
      xml += `    <rejection_reason><![CDATA[${quote.rejection_reason}]]></rejection_reason>\n`
    }

    if (quote.author) {
      xml += '    <author>\n'
      xml += `      <id>${quote.author.id}</id>\n`
      xml += `      <name><![CDATA[${quote.author.name}]]></name>\n`
      xml += `      <is_fictional>${quote.author.is_fictional}</is_fictional>\n`
      if (quote.author.job) xml += `      <job><![CDATA[${quote.author.job}]]></job>\n`
      if (quote.author.birth_date) xml += `      <birth_date>${quote.author.birth_date}</birth_date>\n`
      if (quote.author.death_date) xml += `      <death_date>${quote.author.death_date}</death_date>\n`
      xml += '    </author>\n'
    }

    if (quote.reference) {
      xml += '    <reference>\n'
      xml += `      <id>${quote.reference.id}</id>\n`
      xml += `      <name><![CDATA[${quote.reference.name}]]></name>\n`
      xml += `      <primary_type>${quote.reference.primary_type}</primary_type>\n`
      if (quote.reference.secondary_type) xml += `      <secondary_type>${quote.reference.secondary_type}</secondary_type>\n`
      if (quote.reference.release_date) xml += `      <release_date>${quote.reference.release_date}</release_date>\n`
      xml += '    </reference>\n'
    }

    if (quote.user) {
      xml += '    <user>\n'
      xml += `      <id>${quote.user.id}</id>\n`
      xml += `      <name><![CDATA[${quote.user.name}]]></name>\n`
      if (quote.user.email) xml += `      <email>${escapeXml(quote.user.email)}</email>\n`
      xml += '    </user>\n'
    }

    if (quote.moderator) {
      xml += '    <moderator>\n'
      xml += `      <id>${quote.moderator.id}</id>\n`
      xml += `      <name><![CDATA[${quote.moderator.name}]]></name>\n`
      xml += '    </moderator>\n'
    }

    if (quote.tags && quote.tags.length > 0) {
      xml += '    <tags>\n'
      quote.tags.forEach(tag => {
        xml += '      <tag>\n'
        xml += `        <id>${tag.id}</id>\n`
        xml += `        <name><![CDATA[${tag.name}]]></name>\n`
        xml += `        <color>${tag.color}</color>\n`
        xml += '      </tag>\n'
      })
      xml += '    </tags>\n'
    }

    if (quote._metadata) {
      xml += '    <metadata>\n'
      xml += `      <exported_at>${quote._metadata.exported_at}</exported_at>\n`
      xml += `      <exported_by>${quote._metadata.exported_by}</exported_by>\n`
      xml += `      <export_id>${quote._metadata.export_id}</export_id>\n`
      xml += '    </metadata>\n'
    }

    xml += '  </quote>\n'
  })

  xml += '</quotes>'
  return xml
}

/**
 * Log quotes export to database
 */
async function logQuotesExport(db: any, exportInfo: {
  exportId: string
  filename: string
  format: string
  filters: QuoteExportFilters
  recordCount: number
  userId: number
  fileSize: number
  includeRelations?: boolean
  includeMetadata?: boolean
}): Promise<{ exportLogId: number }> {
  try {
    const result = await db.prepare(`
      INSERT INTO export_logs (
        export_id, 
        filename, 
        format, 
        data_type, 
        filters_applied, 
        record_count, 
        file_size, 
        user_id, 
        include_relations, 
        include_metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      exportInfo.exportId,
      exportInfo.filename,
      exportInfo.format,
      'quotes',
      serializeFiltersForStorage(exportInfo.filters),
      exportInfo.recordCount,
      exportInfo.fileSize,
      exportInfo.userId,
      exportInfo.includeRelations || false,
      exportInfo.includeMetadata || false
    ).run()

    return { exportLogId: result.meta.last_row_id }

  } catch (error) {
    console.error('Failed to log quotes export:', error)
    return { exportLogId: 0 } // Return a fallback ID if logging fails
  }
}
