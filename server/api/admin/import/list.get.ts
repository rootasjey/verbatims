import { getAdminImport } from '~/server/utils/admin-import-progress'

/**
 * Admin API: List Import History (backed by import_logs + live overlay)
 */
export default defineEventHandler(async (event) => {
  // Admin check
  const { user } = await requireUserSession(event)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const limit = parseInt((query.limit as string) || '50')
  const offset = parseInt((query.offset as string) || '0')
  const status = (query.status as string) || ''

  const db = hubDatabase()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database not available' })

  // Base query
  const filters: string[] = []
  const params: any[] = []
  if (status && ['pending','processing','completed','failed'].includes(status)) {
    filters.push('status = ?')
    params.push(status)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  // List imports ordered by created_at desc
  const listStmt = db.prepare(`
    SELECT import_id, filename, format, data_type, record_count, successful_count, failed_count, warnings_count,
           status, created_at, completed_at
    FROM import_logs
    ${where}
    ORDER BY datetime(created_at) DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset)

  const { results: rows = [] } = await listStmt.all<any>()

  // Overlay live in-memory progress when available
  const imports = rows.map((row: any) => {
    const live = getAdminImport(row.import_id)
    const total = live?.totalRecords ?? row.record_count ?? 0
    const processed = live?.processedRecords ?? ((row.successful_count ?? 0) + (row.failed_count ?? 0))
    const success = live?.successfulRecords ?? (row.successful_count ?? 0)
    const failed = live?.failedRecords ?? (row.failed_count ?? 0)
    const warnings = live?.warnings?.length ?? (row.warnings_count ?? 0)
    const startedAt = row.created_at
    const completedAt = row.completed_at
    const duration = completedAt ? (new Date(completedAt).getTime() - new Date(startedAt).getTime()) : (Date.now() - new Date(startedAt).getTime())
    const progressPercentage = total > 0 ? Math.round((processed / total) * 100) : 0

    return {
      id: row.import_id,
      status: live?.status ?? row.status,
      totalRecords: total,
      processedRecords: processed,
      successfulRecords: success,
      failedRecords: failed,
      errorCount: failed, // approximation; detailed errors live in memory only
      warningCount: warnings,
      progressPercentage,
      duration,
      startedAt,
      completedAt,
      // Extra context for UI
      dataType: row.data_type,
      filename: row.filename,
      format: row.format,
    }
  })

  // Summary stats from DB
  const summaryRows = await db.prepare(`
    SELECT status, COUNT(*) AS c FROM import_logs GROUP BY status
  `).all<any>()
  const summaryMap: Record<string, number> = {}
  for (const r of summaryRows.results || []) summaryMap[r.status] = Number(r.c)

  const sumSuccess = await db.prepare(`
    SELECT COALESCE(SUM(successful_count),0) AS s FROM import_logs WHERE status = 'completed'
  `).all<any>()
  const totalRecordsImported = Number((sumSuccess.results?.[0]?.s) ?? 0)

  const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM import_logs ${where}`).bind(...params)
  const countRes = await countStmt.all<any>()
  const total = Number(countRes.results?.[0]?.total ?? imports.length)

  return {
    success: true,
    data: {
      imports,
      summary: {
        total,
        pending: summaryMap['pending'] || 0,
        processing: summaryMap['processing'] || 0,
        completed: summaryMap['completed'] || 0,
        failed: summaryMap['failed'] || 0,
        totalRecordsImported,
      },
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      }
    }
  }
})
