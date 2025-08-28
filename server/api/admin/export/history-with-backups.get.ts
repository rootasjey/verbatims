import type { ExportHistoryEntryWithBackup } from '~/types/export'

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

    const db = hubDatabase()
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM export_logs
    `).first()

    const total = Number(countResult?.total ?? 0)

    const historyResult = await db.prepare(`
      SELECT 
        el.id,
        el.export_id,
        el.filename,
        el.format,
        el.user_id,
        el.data_type,
        el.filters_applied,
        el.record_count,
        el.file_size,
        el.download_count,
        el.created_at,
        el.expires_at,
        u.name as user_name,
        bf.id as backup_id,
        bf.storage_status as backup_storage_status,
        bf.file_path as backup_file_path,
        bf.file_size as backup_file_size,
        bf.compressed_size as backup_compressed_size,
        bf.uploaded_at as backup_uploaded_at,
        bf.expires_at as backup_expires_at,
        bf.access_count as backup_access_count
      FROM export_logs el
      LEFT JOIN users u ON el.user_id = u.id
      LEFT JOIN backup_files bf ON el.id = bf.export_log_id
      ORDER BY el.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()

    const entries: ExportHistoryEntryWithBackup[] = (historyResult?.results || []).map((row: any) => ({
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
