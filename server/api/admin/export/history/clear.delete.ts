/**
 * Admin API: Clear All Export History
 * Deletes all export history entries with confirmation
 */
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throwServer(403, 'Admin access required') }

    const body = await readBody(event)
    const { confirm } = body
    if (!confirm) { throwServer(400, 'Confirmation required to clear all export history') }

    const countResult = await db.select({ total: sql<number>`COUNT(*)` })
      .from(schema.exportLogs);

    const totalEntries = Number(countResult[0]?.total) || 0;

    if (totalEntries === 0) {
      return {
        success: true,
        message: 'No export history entries to clear',
        deletedCount: 0
      }
    }

    // Find all backup file keys before deleting export_logs
    const backupFiles = await db.select({ fileKey: schema.backupFiles.fileKey })
      .from(schema.backupFiles);

    if (backupFiles && backupFiles.length > 0) {
      for (const row of backupFiles) {
        if (row.fileKey) {
          try { await deleteBackupFile(String(row.fileKey)) } 
          catch (err) { console.error('Failed to delete backup file from blob storage:', err) }
        }
      }
    }

    await db.delete(schema.exportLogs);

    return {
      success: true,
      message: `Successfully cleared ${totalEntries} export history entries and deleted backup files`,
      deletedCount: totalEntries
    }

  } catch (error: any) {
    console.error('Clear export history error:', error)
    throwServer(error.statusCode || 500, error.statusMessage || 'Failed to clear export history')
  }
})
