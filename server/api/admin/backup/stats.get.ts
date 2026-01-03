import { db, schema } from 'hub:db'
import { sql, eq, gte, lte, desc, count, sum, avg } from 'drizzle-orm'

/**
 * Admin API: Backup Statistics
 * Provides comprehensive statistics about backup files and storage usage
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    // Get overall statistics
    const overallStats = await db.select({
      total_backups: count(),
      stored_backups: sql<number>`COUNT(CASE WHEN ${schema.backupFiles.storageStatus} = 'stored' THEN 1 END)`,
      uploading_backups: sql<number>`COUNT(CASE WHEN ${schema.backupFiles.storageStatus} = 'uploading' THEN 1 END)`,
      failed_backups: sql<number>`COUNT(CASE WHEN ${schema.backupFiles.storageStatus} = 'failed' THEN 1 END)`,
      expired_backups: sql<number>`COUNT(CASE WHEN ${schema.backupFiles.expiresAt} IS NOT NULL AND ${schema.backupFiles.expiresAt} <= datetime('now') THEN 1 END)`,
      total_size_bytes: sql<number>`SUM(CASE WHEN ${schema.backupFiles.fileSize} IS NOT NULL THEN ${schema.backupFiles.fileSize} ELSE 0 END)`,
      total_compressed_size_bytes: sql<number>`SUM(CASE WHEN ${schema.backupFiles.compressedSize} IS NOT NULL THEN ${schema.backupFiles.compressedSize} ELSE ${schema.backupFiles.fileSize} END)`,
      avg_file_size_bytes: avg(schema.backupFiles.fileSize),
      total_downloads: sum(schema.backupFiles.accessCount)
    }).from(schema.backupFiles).get()

    // Get statistics by data type (from metadata)
    const dataTypeStats = await db.select({
      data_type: schema.exportLogs.dataType,
      backup_count: count(schema.backupFiles.id),
      total_size_bytes: sql<number>`SUM(CASE WHEN ${schema.backupFiles.fileSize} IS NOT NULL THEN ${schema.backupFiles.fileSize} ELSE 0 END)`,
      avg_file_size_bytes: avg(schema.backupFiles.fileSize)
    })
    .from(schema.backupFiles)
    .leftJoin(schema.exportLogs, eq(schema.backupFiles.exportLogId, schema.exportLogs.id))
    .where(eq(schema.backupFiles.storageStatus, 'stored'))
    .groupBy(schema.exportLogs.dataType)
    .orderBy(desc(count(schema.backupFiles.id)))
    .all()

    // Get statistics by format
    const formatStats = await db.select({
      format: schema.exportLogs.format,
      backup_count: count(schema.backupFiles.id),
      total_size_bytes: sql<number>`SUM(CASE WHEN ${schema.backupFiles.fileSize} IS NOT NULL THEN ${schema.backupFiles.fileSize} ELSE 0 END)`
    })
    .from(schema.backupFiles)
    .leftJoin(schema.exportLogs, eq(schema.backupFiles.exportLogId, schema.exportLogs.id))
    .where(eq(schema.backupFiles.storageStatus, 'stored'))
    .groupBy(schema.exportLogs.format)
    .orderBy(desc(count(schema.backupFiles.id)))
    .all()

    // Get recent backup activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentActivity = await db.select({
      date: sql<string>`DATE(${schema.backupFiles.createdAt})`,
      backups_created: count(),
      total_size_bytes: sql<number>`SUM(CASE WHEN ${schema.backupFiles.fileSize} IS NOT NULL THEN ${schema.backupFiles.fileSize} ELSE 0 END)`
    })
    .from(schema.backupFiles)
    .where(gte(schema.backupFiles.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${schema.backupFiles.createdAt})`)
    .orderBy(desc(sql`DATE(${schema.backupFiles.createdAt})`))
    .limit(30)
    .all()

    // Get compression statistics
    const compressionStats = await db.select({
      compression_type: schema.backupFiles.compressionType,
      file_count: count(),
      original_size_bytes: sum(schema.backupFiles.fileSize),
      compressed_size_bytes: sql<number>`SUM(CASE WHEN ${schema.backupFiles.compressedSize} IS NOT NULL THEN ${schema.backupFiles.compressedSize} ELSE ${schema.backupFiles.fileSize} END)`,
      avg_compression_ratio_percent: sql<number>`AVG(CASE WHEN ${schema.backupFiles.compressedSize} IS NOT NULL AND ${schema.backupFiles.fileSize} > 0 THEN (1.0 - CAST(${schema.backupFiles.compressedSize} AS REAL) / CAST(${schema.backupFiles.fileSize} AS REAL)) * 100 ELSE 0 END)`
    })
    .from(schema.backupFiles)
    .where(eq(schema.backupFiles.storageStatus, 'stored'))
    .groupBy(schema.backupFiles.compressionType)
    .all()

    return {
      success: true,
      data: {
        overview: {
          total_backups: Number(overallStats?.total_backups ?? 0) || 0,
          stored_backups: Number(overallStats?.stored_backups ?? 0) || 0,
          uploading_backups: Number(overallStats?.uploading_backups ?? 0) || 0,
          failed_backups: Number(overallStats?.failed_backups ?? 0) || 0,
          expired_backups: Number(overallStats?.expired_backups ?? 0) || 0,
          total_size_bytes: Number(overallStats?.total_size_bytes ?? 0) || 0,
          total_compressed_size_bytes: Number(overallStats?.total_compressed_size_bytes ?? 0) || 0,
          avg_file_size_bytes: Number(overallStats?.avg_file_size_bytes ?? 0) || 0,
          total_downloads: Number(overallStats?.total_downloads ?? 0) || 0,
          storage_efficiency_percent: Number(overallStats?.total_size_bytes ?? 0) > 0
            ? ((1 - (Number(overallStats?.total_compressed_size_bytes ?? 0) / Number(overallStats?.total_size_bytes ?? 0)) * 100))
            : 0
        },
        by_data_type: dataTypeStats || [],
        by_format: formatStats || [],
        recent_activity: recentActivity || [],
        compression: compressionStats || [],
        generated_at: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('Backup stats error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get backup statistics'
    })
  }
})
