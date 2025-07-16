/**
 * Admin API: Export Data
 * Exports reference data in various formats (JSON, CSV, Excel, SQL)
 */

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { format, filter, includeMetadata, compressOutput, includeUrls } = body

    if (!format) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Export format is required'
      })
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Build query based on filter
    let query = 'SELECT * FROM quote_references'
    const params: any[] = []

    if (filter && filter !== 'all') {
      switch (filter) {
        case 'film':
        case 'book':
        case 'tv_series':
        case 'music':
        case 'other':
          query += ' WHERE primary_type = ?'
          params.push(filter)
          break
        case 'recent':
          query += ' WHERE created_at > datetime("now", "-30 days")'
          break
        case 'popular':
          query += ' ORDER BY views_count DESC LIMIT 1000'
          break
      }
    }

    if (!query.includes('ORDER BY')) {
      query += ' ORDER BY created_at DESC'
    }

    // Execute query
    const referencesResult = await db.prepare(query).bind(...params).all()
    const references = referencesResult.results || []

    // Process data based on options
    let exportData = references.map((ref: any) => {
      const processed: any = { ...ref }

      // Handle URLs
      if (!includeUrls) {
        delete processed.urls
      } else if (processed.urls) {
        try {
          processed.urls = JSON.parse(processed.urls)
        } catch {
          // Keep as string if parsing fails
        }
      }

      // Add metadata if requested
      if (includeMetadata) {
        processed._metadata = {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          export_filter: filter || 'all'
        }
      }

      return processed
    })

    // Generate export based on format
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let filename: string
    let content: string
    let mimeType: string

    switch (format) {
      case 'json':
        filename = `references-export-${timestamp}.json`
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        break

      case 'csv':
        filename = `references-export-${timestamp}.csv`
        content = generateCSV(exportData)
        mimeType = 'text/csv'
        break

      case 'xlsx':
        filename = `references-export-${timestamp}.xlsx`
        content = await generateExcel(exportData)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      case 'sql':
        filename = `references-export-${timestamp}.sql`
        content = generateSQL(exportData)
        mimeType = 'application/sql'
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported export format'
        })
    }

    // Store export file (in production, use blob storage)
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    // For now, return the content directly
    // In production, you'd save to blob storage and return a download URL
    
    // Log the export
    await logExport(db, {
      exportId,
      filename,
      format,
      filter: filter || 'all',
      recordCount: exportData.length,
      userId: user.id
    })

    return {
      success: true,
      data: {
        exportId,
        filename,
        recordCount: exportData.length,
        downloadUrl: `/api/admin/data-management/download/${exportId}`,
        // For demo purposes, include content directly
        content: format === 'xlsx' ? null : content, // Don't include binary content
        mimeType
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Export failed'
    })
  }
})

function generateCSV(data: any[]): string {
  if (data.length === 0) return ''

  // Get all unique keys
  const allKeys = new Set<string>()
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== '_metadata') allKeys.add(key)
    })
  })

  const headers = Array.from(allKeys)
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(item => 
      headers.map(header => {
        const value = item[header]
        if (value === null || value === undefined) return ''
        
        // Handle objects/arrays
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        
        // Escape CSV values
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        
        return stringValue
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

async function generateExcel(data: any[]): Promise<string> {
  // In a real implementation, you'd use a library like xlsx or exceljs
  // For now, return a placeholder
  return 'Excel export not implemented in demo'
}

function generateSQL(data: any[]): string {
  if (data.length === 0) return '-- No data to export'

  const sqlStatements = [
    '-- Reference Data Export',
    `-- Generated at: ${new Date().toISOString()}`,
    `-- Total records: ${data.length}`,
    '',
    'BEGIN TRANSACTION;',
    ''
  ]

  data.forEach(item => {
    const columns = Object.keys(item).filter(key => key !== '_metadata')
    const values = columns.map(col => {
      const value = item[col]
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
      return String(value)
    })

    sqlStatements.push(
      `INSERT INTO quote_references (${columns.join(', ')}) VALUES (${values.join(', ')});`
    )
  })

  sqlStatements.push('', 'COMMIT;')
  return sqlStatements.join('\n')
}

async function logExport(db: any, exportInfo: any) {
  try {
    // Create export log table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS export_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        export_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        format TEXT NOT NULL,
        filter_applied TEXT,
        record_count INTEGER,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Log the export
    await db.prepare(`
      INSERT INTO export_logs (export_id, filename, format, filter_applied, record_count, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      exportInfo.exportId,
      exportInfo.filename,
      exportInfo.format,
      exportInfo.filter,
      exportInfo.recordCount,
      exportInfo.userId
    ).run()

  } catch (error) {
    console.error('Failed to log export:', error)
    // Don't fail the export if logging fails
  }
}
