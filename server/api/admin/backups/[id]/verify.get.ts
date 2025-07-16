/**
 * Admin API: Verify Backup Integrity
 * Verifies that a backup is valid and can be restored
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

    const backupManager = getBackupManager()
    const verification = await backupManager.verifyBackup(backupId)

    return {
      success: true,
      data: verification
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to verify backup'
    })
  }
})
