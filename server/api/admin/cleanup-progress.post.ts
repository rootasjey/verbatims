/**
 * Admin API: Cleanup Old Progress Records
 * Manually trigger cleanup of old import progress records
 */

import { cleanupOldProgress, checkForStuckImports, getImportStats } from '~/server/utils/onboarding-progress'

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions (optional - you might want to allow this for maintenance)
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const query = getQuery(event)
    const maxAgeHours = Number(query.maxAge) || 24 // Default 24 hours
    const timeoutMinutes = Number(query.timeout) || 30 // Default 30 minutes

    // Get stats before cleanup
    const statsBefore = getImportStats()

    // Check for stuck imports
    console.log('Checking for stuck imports...')
    checkForStuckImports(timeoutMinutes * 60 * 1000)

    // Clean up old progress records
    console.log(`Cleaning up progress records older than ${maxAgeHours} hours...`)
    cleanupOldProgress(maxAgeHours * 60 * 60 * 1000)

    // Get stats after cleanup
    const statsAfter = getImportStats()

    const cleaned = statsBefore.total - statsAfter.total

    return {
      success: true,
      message: `Cleanup completed. Removed ${cleaned} old progress records.`,
      data: {
        before: statsBefore,
        after: statsAfter,
        cleaned,
        settings: {
          maxAgeHours,
          timeoutMinutes
        }
      }
    }

  } catch (error: any) {
    console.error('Progress cleanup error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to cleanup progress records'
    })
  }
})
