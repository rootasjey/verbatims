import { db, schema } from 'hub:db'
import { eq, sql, desc } from 'drizzle-orm'

/**
 * Admin API: Export History
 * Retrieves export history with pagination and filtering
 */
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

    let historyQuery = db.select({
      id: schema.exportLogs.id,
      export_id: schema.exportLogs.exportId,
      filename: schema.exportLogs.filename,
      format: schema.exportLogs.format,
      data_type: schema.exportLogs.dataType,
      filters_applied: schema.exportLogs.filtersApplied,
      record_count: schema.exportLogs.recordCount,
      file_size: schema.exportLogs.fileSize,
      user_id: schema.exportLogs.userId,
      user_name: schema.users.name,
      download_count: schema.exportLogs.downloadCount,
      created_at: schema.exportLogs.createdAt,
      expires_at: schema.exportLogs.expiresAt
    })
      .from(schema.exportLogs)
      .leftJoin(schema.users, eq(schema.exportLogs.userId, schema.users.id))
      .$dynamic()

    if (format) {
      historyQuery = historyQuery.where(eq(schema.exportLogs.format, format))
    }

    if (user_id) {
      historyQuery = historyQuery.where(eq(schema.exportLogs.userId, user_id))
    }

    const history = await historyQuery
      .orderBy(desc(schema.exportLogs.createdAt))
      .limit(limit)
      .offset(offset)

    let countQuery = db
      .select({ total: sql<number>`COUNT(*)`.as('total') })
      .from(schema.exportLogs)
      .$dynamic()

    if (format) {
      countQuery = countQuery.where(eq(schema.exportLogs.format, format))
    }

    if (user_id) {
      countQuery = countQuery.where(eq(schema.exportLogs.userId, user_id))
    }

    const countResult = await countQuery
    const total = Number(countResult[0]?.total) || 0
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
