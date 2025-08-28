/**
 * Admin API: Export History
 * Retrieves export history with pagination and filtering
 */

import type { ExportHistoryEntry } from '~/types/export'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin' && user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const format = query.format as string
    const user_id = query.user_id ? parseInt(query.user_id as string) : undefined

    const db = hubDatabase()
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

    const countResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM export_logs el
      ${whereClause}
    `).bind(...bindings).first()

    const total = Number(countResult?.total) || 0
    const hasMore = offset + history.length < total

    const processedHistory: ExportHistoryEntry[] = history.map((entry: any) => ({
      id: entry.export_id,
      filename: entry.filename,
      format: entry.format,
      data_type: entry.data_type,
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
