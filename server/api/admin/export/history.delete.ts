/**
 * Admin API: Delete Export History Entry
 * Deletes a specific export history entry by ID
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

    const body = await readBody(event)
    const { exportId } = body

    if (!exportId) { throw createError({ statusCode: 400, statusMessage: 'Export ID is required' }) }

    const db = hubDatabase()
    const exportLog = await db.prepare(`
      SELECT id FROM export_logs WHERE export_id = ?
    `).bind(exportId).first()

    if (!exportLog) { throw createError({ statusCode: 404, statusMessage: 'Export history entry not found' }) }

    // Find associated backup file (if any)
    const backupFile = await db.prepare(`
      SELECT file_key FROM backup_files WHERE export_log_id = ?
    `).bind(exportLog.id).first()

    // Delete backup file from blob storage if exists
    if (backupFile && typeof backupFile.file_key === 'string') {
      try { await deleteBackupFile(String(backupFile.file_key)) } 
      catch (err: any) { console.error('Failed to delete backup file from blob storage:', err) }
    }

    // Delete the export history entry (will also delete backup_files row via FK cascade)
    const result = await db.prepare(`
      DELETE FROM export_logs 
      WHERE export_id = ?
    `).bind(exportId).run()

    if (!result.success) { throw createError({ statusCode: 500, statusMessage: 'Failed to delete export history entry' }) }

    return {
      success: true,
      message: 'Export history entry and backup file deleted successfully'
    }

  } catch (error: any) {
    console.error('Delete export history error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to delete export history entry'
    })
  }
})
