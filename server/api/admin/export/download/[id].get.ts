/**
 * Admin API: Download Export File
 * Handles downloading of exported data files with proper MIME types and cleanup
 */

import type { QuoteExportFilters } from '~/types/export'
import { parseFiltersFromExportLog, buildFilterConditions } from '~/server/utils/export-filters'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const exportId = getRouterParam(event, 'id')
    if (!exportId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Export ID is required'
      })
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Get export information from database
    const exportLog = await db.prepare(`
      SELECT * FROM quotes_export_logs 
      WHERE export_id = ? AND expires_at > datetime('now')
    `).bind(exportId).first()

    if (!exportLog) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Export not found or expired'
      })
    }

    // For this demo implementation, we'll regenerate the export content
    // In production, you would store files in blob storage and serve them directly

    // Parse filters from the log with type safety
    const filters = parseFiltersFromExportLog(exportLog)

    // Rebuild the export (this is a simplified approach for demo)
    // In production, you'd store the actual file content
    const { query, bindings } = buildQuotesQueryForDownload(filters, true, 0)
    const quotesResult = await db.prepare(query).bind(...bindings).all()
    const quotes = (quotesResult?.results || []) as any[]

    // Process quotes data (simplified version)
    const processedQuotes = quotes.map((quote: any) => ({
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
      rejection_reason: quote.rejection_reason || undefined,
      author: quote.author_name ? {
        id: quote.author_id,
        name: quote.author_name,
        is_fictional: Boolean(quote.author_is_fictional)
      } : undefined,
      reference: quote.reference_name ? {
        id: quote.reference_id,
        name: quote.reference_name,
        primary_type: quote.reference_type
      } : undefined,
      user: quote.user_name ? {
        id: quote.user_id,
        name: quote.user_name
      } : undefined,
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name: name.trim(),
        color: quote.tag_colors?.split(',')[index] || 'gray'
      })) : undefined
    }))

    // Generate content based on format
    let content: string
    let mimeType: string

    switch (exportLog.format) {
      case 'json':
        content = JSON.stringify(processedQuotes, null, 2)
        mimeType = 'application/json'
        break

      case 'csv':
        content = generateCSVForDownload(processedQuotes)
        mimeType = 'text/csv'
        break

      case 'xml':
        content = generateXMLForDownload(processedQuotes)
        mimeType = 'application/xml'
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported export format'
        })
    }

    // Update download count
    await db.prepare(`
      UPDATE quotes_export_logs 
      SET download_count = download_count + 1 
      WHERE export_id = ?
    `).bind(exportId).run()

    // Set response headers for file download
    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Content-Disposition', `attachment; filename="${exportLog.filename}"`)
    setHeader(event, 'Content-Length', Buffer.byteLength(content, 'utf8'))
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Expires', '0')

    return content

  } catch (error: any) {
    console.error('Export download error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Download failed'
    })
  }
})

/**
 * Build SQL query for download with type-safe filters
 */
function buildQuotesQueryForDownload(filters: QuoteExportFilters, includeRelations: boolean, limit: number) {
  let query = `
    SELECT
      q.*,
      a.name as author_name,
      a.is_fictional as author_is_fictional,
      r.name as reference_name,
      r.primary_type as reference_type,
      u.name as user_name,
      GROUP_CONCAT(DISTINCT t.name) as tag_names,
      GROUP_CONCAT(DISTINCT t.color) as tag_colors
    FROM quotes q
    LEFT JOIN authors a ON q.author_id = a.id
    LEFT JOIN quote_references r ON q.reference_id = r.id
    LEFT JOIN users u ON q.user_id = u.id
    LEFT JOIN quote_tags qt ON q.id = qt.quote_id
    LEFT JOIN tags t ON qt.tag_id = t.id
  `

  // Use the type-safe filter condition builder
  const { conditions, bindings } = buildFilterConditions(filters)

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  query += ' GROUP BY q.id ORDER BY q.created_at DESC'

  if (limit > 0) {
    query += ' LIMIT ?'
    bindings.push(limit)
  }

  return { query, bindings }
}

/**
 * Generate CSV for download
 */
function generateCSVForDownload(quotes: any[]): string {
  if (quotes.length === 0) return ''

  const headers = [
    'id', 'name', 'language', 'status', 'views_count', 'likes_count', 'shares_count',
    'is_featured', 'created_at', 'updated_at', 'author_name', 'reference_name', 'tags'
  ]

  const csvRows = [
    headers.join(','),
    ...quotes.map(quote => [
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
      `"${(quote.author?.name || '').replace(/"/g, '""')}"`,
      `"${(quote.reference?.name || '').replace(/"/g, '""')}"`,
      `"${quote.tags?.map((t: any) => t.name).join('; ') || ''}"`
    ].join(','))
  ]

  return csvRows.join('\n')
}

/**
 * Generate XML for download
 */
function generateXMLForDownload(quotes: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<quotes>\n'

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
    
    if (quote.author) {
      xml += `    <author><![CDATA[${quote.author.name}]]></author>\n`
    }
    
    if (quote.reference) {
      xml += `    <reference><![CDATA[${quote.reference.name}]]></reference>\n`
    }
    
    if (quote.tags && quote.tags.length > 0) {
      xml += `    <tags>${quote.tags.map((t: any) => t.name).join(', ')}</tags>\n`
    }
    
    xml += '  </quote>\n'
  })

  xml += '</quotes>'
  return xml
}
