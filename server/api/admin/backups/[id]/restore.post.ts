/**
 * Admin API: Restore from Backup
 * Restores the database from a specific backup
 */

import { getBackupManager } from '~/server/utils/backup-manager'

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

    const backupId = getRouterParam(event, 'id')
    if (!backupId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Backup ID is required'
      })
    }

    const body = await readBody(event)
    const { confirmRestore } = body

    if (!confirmRestore) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Restore confirmation is required'
      })
    }

    const backupManager = getBackupManager()
    const result = await backupManager.restoreFromBackup(backupId, confirmRestore)

    return {
      success: true,
      data: result,
      message: `Successfully restored ${result.recordCount} records from backup ${backupId}`
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to restore backup'
    })
  }
})
