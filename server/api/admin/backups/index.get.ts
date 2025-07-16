/**
 * Admin API: List Database Backups
 * Returns a list of all database backups with their metadata
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

    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    const backupManager = getBackupManager()
    const result = await backupManager.listBackups(limit, offset)
    const stats = await backupManager.getBackupStats()

    return {
      success: true,
      data: {
        backups: result.backups,
        stats,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: result.hasMore
        }
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to list backups'
    })
  }
})
