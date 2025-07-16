/**
 * Admin API: Create Database Backup
 * Creates a new backup of the quote_references table
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

    const body = await readBody(event)
    const { description = 'Manual backup' } = body

    const backupManager = getBackupManager()
    const backup = await backupManager.createBackup(description)

    return {
      success: true,
      data: backup,
      message: `Backup created successfully with ${backup.recordCount} records`
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create backup'
    })
  }
})
