/**
 * Admin API: Get Progress Statistics
 * Monitor the health and status of import progress tracking
 */

import type { getImportStats } from '~/types''~/server/utils/onboarding-progress'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') throwServer(403, 'Admin access required')

    const stats = getImportStats()

    // Calculate system health
    const totalActive = stats.pending + stats.processing
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0

    // Determine system health status
    let healthStatus = 'healthy'
    let healthMessage = 'All systems operating normally'

    if (stats.processing > 5) {
      healthStatus = 'warning'
      healthMessage = 'High number of concurrent imports'
    } else if (failureRate > 20) {
      healthStatus = 'warning'
      healthMessage = 'High failure rate detected'
    } else if (stats.pending > 10) {
      healthStatus = 'warning'
      healthMessage = 'Many imports queued'
    }

    return {
      success: true,
      data: {
        stats,
        metrics: {
          totalActive,
          completionRate: Math.round(completionRate * 100) / 100,
          failureRate: Math.round(failureRate * 100) / 100
        },
        health: {
          status: healthStatus,
          message: healthMessage
        },
        timestamp: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('Progress stats error:', error)
    if (error && error.statusCode) throw error
    throwServer(500, 'Failed to get progress statistics')
  }
})
