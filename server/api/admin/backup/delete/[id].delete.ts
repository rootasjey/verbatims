/**
 * Admin API: Delete Backup File
 * Deletes backup file from both R2 storage and database
 */

import { BackupService } from '~/server/utils/backupStorage'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const backupId = getRouterParam(event, 'id')
    if (!backupId || isNaN(Number(backupId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid backup ID' })
    }

    const db = hubDatabase()
    const backupService = new BackupService(db)
    await backupService.deleteBackup(Number(backupId))
    
    return {
      success: true,
      message: 'Backup file deleted successfully'
    }
  } catch (error: any) {
    console.error('Delete backup endpoint error:', error)
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
