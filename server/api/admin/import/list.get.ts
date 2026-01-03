import { getAdminImport } from '~/server/utils/admin-import-progress'
import { db, schema } from 'hub:db'
import { eq, desc, sql } from 'drizzle-orm'

/**
 * Admin API: List Import History (backed by import_logs + live overlay)
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || user.role !== 'admin') throwServer(403, 'Admin access required')

  const query = getQuery(event)
  const limit = parseInt((query.limit as string) || '50')
  const offset = parseInt((query.offset as string) || '0')
  const status = (query.status as string) || ''

  // Build WHERE clause for status filter
  let whereCondition = undefined
  if (status && ['pending','processing','completed','failed'].includes(status)) {
    whereCondition = eq(schema.importLogs.status, status as any)
  }

  // List imports ordered by created_at desc
  const rows = await db.select({
    import_id: schema.importLogs.importId,
    filename: schema.importLogs.filename,
    format: schema.importLogs.format,
    data_type: schema.importLogs.dataType,
    record_count: schema.importLogs.recordCount,
    successful_count: schema.importLogs.successfulCount,
    failed_count: schema.importLogs.failedCount,
    warnings_count: schema.importLogs.warningsCount,
    status: schema.importLogs.status,
    created_at: schema.importLogs.createdAt,
    completed_at: schema.importLogs.completedAt,
  })
    .from(schema.importLogs)
    .where(whereCondition)
    .orderBy(desc(schema.importLogs.createdAt))
    .limit(limit)
    .offset(offset)

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
  const summaryRows = await db.select({
    status: schema.importLogs.status,
    count: sql<number>`COUNT(*)`.as('count')
  })
    .from(schema.importLogs)
    .groupBy(schema.importLogs.status)
  
  const summaryMap: Record<string, number> = {}
  for (const r of summaryRows) summaryMap[r.status] = Number(r.count)

  const sumSuccess = await db.select({
    sum: sql<number>`COALESCE(SUM(${schema.importLogs.successfulCount}),0)`.as('sum')
  })
    .from(schema.importLogs)
    .where(eq(schema.importLogs.status, 'completed'))
  const totalRecordsImported = Number(sumSuccess[0]?.sum ?? 0)

  const countRes = await db.select({
    total: sql<number>`COUNT(*)`.as('total')
  })
    .from(schema.importLogs)
    .where(whereCondition)
  const total = Number(countRes[0]?.total ?? imports.length)

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
