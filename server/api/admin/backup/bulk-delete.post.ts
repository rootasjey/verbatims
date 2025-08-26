import { deleteBackup } from '~/server/utils/backup-storage'

/**
 * Admin API: Bulk Delete Backup Files
 * Deletes multiple backup files in a single operation
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const { backup_ids } = body

    if (!Array.isArray(backup_ids) || backup_ids.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'backup_ids array is required and must not be empty' })
    }

    const validIds = backup_ids.filter(id => !isNaN(Number(id))).map(id => Number(id))
    if (validIds.length !== backup_ids.length) {
      throw createError({ statusCode: 400, statusMessage: 'All backup IDs must be valid numbers' })
    }

    const db = hubDatabase()
    const results = {
      total: validIds.length,
      deleted: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const backupId of validIds) {
      try {
        await deleteBackup(db, backupId)
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
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
