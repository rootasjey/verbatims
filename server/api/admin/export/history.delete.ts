/**
 * Admin API: Delete Export History Entry
 * Deletes a specific export history entry by ID
 */
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

    const body = await readBody(event)
    const { exportId } = body

    if (!exportId) { throw createError({ statusCode: 400, statusMessage: 'Export ID is required' }) }

    const exportLog = await db.select({ id: schema.exportLogs.id })
      .from(schema.exportLogs)
      .where(eq(schema.exportLogs.exportId, exportId))
      .limit(1);

    if (!exportLog || exportLog.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Export history entry not found' })
    }

    // Find associated backup file (if any)
    const backupFile = await db.select({ fileKey: schema.backupFiles.fileKey })
      .from(schema.backupFiles)
      .where(eq(schema.backupFiles.exportLogId, exportLog[0].id))
      .limit(1);

    // Delete backup file from blob storage if exists
    if (backupFile && backupFile.length > 0 && backupFile[0].fileKey) {
      try { await deleteBackupFile(String(backupFile[0].fileKey)) } 
      catch (err: any) { console.error('Failed to delete backup file from blob storage:', err) }
    }

    // Delete the export history entry (will also delete backup_files row via FK cascade)
    await db.delete(schema.exportLogs)
      .where(eq(schema.exportLogs.exportId, exportId));

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
