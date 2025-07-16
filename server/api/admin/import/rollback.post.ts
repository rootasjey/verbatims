/**
 * Admin API: Rollback Import
 * Rolls back a completed import by restoring from backup
 */

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { backupId, confirmRollback } = body

    if (!backupId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Backup ID is required'
      })
    }

    if (!confirmRollback) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Rollback confirmation is required'
      })
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Check if backup exists
    const backupTableName = `quote_references_backup_${backupId}`
    const backupExists = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).bind(backupTableName).first()

    if (!backupExists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Backup not found'
      })
    }

    // Get backup info
    const backupInfo = await db.prepare(`
      SELECT COUNT(*) as count FROM ${backupTableName}
    `).first()

    if (!backupInfo) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get backup info'
      })
    }

    // Begin transaction
    await db.prepare('BEGIN TRANSACTION').run()

    try {
      // Clear current references
      await db.prepare('DELETE FROM quote_references').run()

      // Restore from backup
      await db.prepare(`
        INSERT INTO quote_references 
        SELECT * FROM ${backupTableName}
      `).run()

      // Commit transaction
      await db.prepare('COMMIT').run()

      // Log the rollback
      console.log(`Rollback completed: Restored ${backupInfo.count} references from backup ${backupId}`)

      return {
        success: true,
        message: `Successfully rolled back to backup ${backupId}`,
        restoredRecords: backupInfo.count
      }

    } catch (error) {
      // Rollback transaction
      await db.prepare('ROLLBACK').run()
      throw error
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Rollback failed'
    })
  }
})
