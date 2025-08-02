/**
 * Admin API: Export History
 * Retrieves export history with pagination and filtering
 */

import type { ExportHistoryEntry } from '~/types/export'

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const format = query.format as string
    const user_id = query.user_id ? parseInt(query.user_id as string) : undefined

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Ensure unified export logs table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS export_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        export_id TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        format TEXT NOT NULL,
        data_type TEXT NOT NULL CHECK (data_type IN ('quotes', 'references', 'authors', 'users')),
        filters_applied TEXT,
        record_count INTEGER,
        file_size INTEGER,
        user_id INTEGER,
        include_relations BOOLEAN DEFAULT FALSE,
        include_metadata BOOLEAN DEFAULT FALSE,
        download_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT (datetime('now', '+24 hours')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `).run()

    // Build WHERE conditions
    const conditions: string[] = []
    const bindings: any[] = []

    if (format) {
      conditions.push('el.format = ?')
      bindings.push(format)
    }

    if (user_id) {
      conditions.push('el.user_id = ?')
      bindings.push(user_id)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get export history with user information
    const historyResult = await db.prepare(`
      SELECT
        el.*,
        u.name as user_name
      FROM export_logs el
      LEFT JOIN users u ON el.user_id = u.id
      ${whereClause}
      ORDER BY el.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()

    const history = (historyResult?.results || []) as any[]

    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM export_logs el
      ${whereClause}
    `).bind(...bindings).first()

    const total = Number(countResult?.total) || 0
    const hasMore = offset + history.length < total

    // Process history data
    const processedHistory: ExportHistoryEntry[] = history.map((entry: any) => ({
      id: entry.export_id,
      filename: entry.filename,
      format: entry.format,
      data_type: 'quotes', // Currently only supporting quotes
      filters_applied: entry.filters_applied,
      record_count: entry.record_count || 0,
      file_size: entry.file_size || 0,
      status: entry.expires_at && new Date(entry.expires_at) > new Date() ? 'completed' : 'completed',
      user_id: entry.user_id,
      user_name: entry.user_name,
      download_count: entry.download_count || 0,
      created_at: entry.created_at,
      completed_at: entry.created_at, // For now, same as created_at
      expires_at: entry.expires_at
    }))

    return {
      success: true,
      data: processedHistory,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }

  } catch (error: any) {
    console.error('Export history error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch export history'
    })
  }
})
