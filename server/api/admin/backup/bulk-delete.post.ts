import { deleteBackup } from '../../../utils/backup-storage'

/**
 * Admin API: Bulk Delete Backup Files
 * Deletes multiple backup files in a single operation
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const body = await readBody(event)
    const { backup_ids } = body

    if (!Array.isArray(backup_ids) || backup_ids.length === 0) {
      throwServer(400, 'backup_ids array is required and must not be empty')
    }

    const validIds = backup_ids.filter(id => !isNaN(Number(id))).map(id => Number(id))
    if (validIds.length !== backup_ids.length) {
      throwServer(400, 'All backup IDs must be valid numbers')
    }

    const results = {
      total: validIds.length,
      deleted: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const backupId of validIds) {
      try {
        await deleteBackup(backupId)
        results.deleted++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Backup ${backupId}: ${error.message}`)
        console.error(`Failed to delete backup ${backupId}:`, error)
      }
    }

    return {
      success: true,
      data: results,
      message: `Bulk deletion completed: ${results.deleted} deleted, ${results.failed} failed`
    }

  } catch (error: any) {
    console.error('Bulk delete backup error:', error)
    if ((error as any).statusCode) throw error
    throwServer(500, 'Internal server error')
  }
})
