/**
 * Admin API: Delete Backup File
 * Deletes backup file from both R2 storage and database
 */

import { deleteBackup } from '../../../../utils/backup-storage'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const backupId = getRouterParam(event, 'id')
    if (!backupId || isNaN(Number(backupId))) {
      throwServer(400, 'Invalid backup ID')
    }

    await deleteBackup(Number(backupId))

    return {
      success: true,
      message: 'Backup file deleted successfully'
    }
  } catch (error: any) {
    console.error('Delete backup endpoint error:', error)
    if ((error as any).statusCode) throw error
    
    throwServer(500, 'Internal server error')
  }
})
