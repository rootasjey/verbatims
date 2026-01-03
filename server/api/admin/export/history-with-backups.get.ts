import type { ExportHistoryEntryWithBackup } from '~/types/export'
import { db, schema } from 'hub:db'
import { eq, sql, desc } from 'drizzle-orm'

/**
 * Admin API: Export History with Backup Information
 * Enhanced export history that includes backup file information
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const offset = (page - 1) * limit

    const countResult = await db.select({ total: sql<number>`COUNT(*)`.as('total') })
      .from(schema.exportLogs)

    const total = Number(countResult[0]?.total ?? 0)

    const historyResult = await db.select({
      id: schema.exportLogs.id,
      export_id: schema.exportLogs.exportId,
      filename: schema.exportLogs.filename,
      format: schema.exportLogs.format,
      user_id: schema.exportLogs.userId,
      data_type: schema.exportLogs.dataType,
      filters_applied: schema.exportLogs.filtersApplied,
      record_count: schema.exportLogs.recordCount,
      file_size: schema.exportLogs.fileSize,
      download_count: schema.exportLogs.downloadCount,
      created_at: schema.exportLogs.createdAt,
      expires_at: schema.exportLogs.expiresAt,
      user_name: schema.users.name,
      backup_id: schema.backupFiles.id,
      backup_storage_status: schema.backupFiles.storageStatus,
      backup_file_path: schema.backupFiles.filePath,
      backup_file_size: schema.backupFiles.fileSize,
      backup_compressed_size: schema.backupFiles.compressedSize,
      backup_uploaded_at: schema.backupFiles.uploadedAt,
      backup_expires_at: schema.backupFiles.expiresAt,
      backup_access_count: schema.backupFiles.accessCount
    })
    .from(schema.exportLogs)
    .leftJoin(schema.users, eq(schema.exportLogs.userId, schema.users.id))
    .leftJoin(schema.backupFiles, eq(schema.exportLogs.id, schema.backupFiles.exportLogId))
    .orderBy(desc(schema.exportLogs.createdAt))
    .limit(limit)
    .offset(offset)

    const entries: ExportHistoryEntryWithBackup[] = (historyResult || []).map((row: any) => ({
      id: row.export_id,
      filename: row.filename,
      format: row.format,
      data_type: row.data_type,
      filters_applied: row.filters_applied,
      record_count: row.record_count,
      file_size: row.file_size,
      status: 'completed', // Assuming completed for existing entries
      user_id: row.user_id,
      user_name: row.user_name,
      download_count: row.download_count,
      created_at: row.created_at,
      expires_at: row.expires_at,
      backup_file: row.backup_id ? {
        id: row.backup_id,
        storage_status: row.backup_storage_status,
        file_path: row.backup_file_path,
        file_size: row.backup_file_size,
        compressed_size: row.backup_compressed_size,
        uploaded_at: row.backup_uploaded_at,
        expires_at: row.backup_expires_at,
        access_count: row.backup_access_count
      } : undefined
    }))

    return {
      success: true,
      data: {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    }

  } catch (error: any) {
    console.error('Export history with backups error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to load export history'
    })
  }
})
