import { deleteExpiredBackupFiles, listBackupFiles } from '../../../utils/backup-database'
import { deleteBackupFile } from '../../../utils/backup-storage'

/**
 * Admin API: Cleanup Expired Backup Files
 * Removes expired backup files from both R2 storage and database
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const expiredFiles = await listBackupFiles({
      page: 1,
      limit: 1000, // Get all expired files
      dateTo: new Date().toISOString() // Files that should have expired by now
    })

    const expiredBackups = expiredFiles.files.filter(file => 
      file.expires_at && new Date(file.expires_at) <= new Date()
    )

    let deletedFromR2 = 0
    let failedR2Deletions = 0

    for (const backup of expiredBackups) {
      try {
        await deleteBackupFile(backup.file_key)
        deletedFromR2++
      } catch (error) {
        console.error(`Failed to delete backup ${backup.file_key} from R2:`, error)
        failedR2Deletions++
      }
    }

    const deletedFromDb = await deleteExpiredBackupFiles()

    return {
      success: true,
      data: {
        total_expired: expiredBackups.length,
        deleted_from_r2: deletedFromR2,
        failed_r2_deletions: failedR2Deletions,
        deleted_from_database: deletedFromDb,
        cleanup_completed_at: new Date().toISOString()
      },
      message: `Cleanup completed: ${deletedFromDb} expired backup files removed`
    }

  } catch (error: any) {
    console.error('Backup cleanup error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to cleanup expired backups'
    })
  }
})
