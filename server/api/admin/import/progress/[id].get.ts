/**
 * Admin API: Get Import Progress
 * Returns real-time progress information for an ongoing import
 */

import { importProgressStore } from '../references.post'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const importId = getRouterParam(event, 'id')
    if (!importId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Import ID is required'
      })
    }

    // Try to find progress in references import store
    let progress = importProgressStore.get(importId)

    if (!progress) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Import not found'
      })
    }

    // Calculate progress percentage
    const progressPercentage = progress.totalRecords > 0 
      ? Math.round((progress.processedRecords / progress.totalRecords) * 100)
      : 0

    // Calculate duration
    const duration = progress.completedAt 
      ? progress.completedAt.getTime() - progress.startedAt.getTime()
      : Date.now() - progress.startedAt.getTime()

    // Estimate remaining time
    let estimatedTimeRemaining: number | null = null
    if (progress.status === 'processing' && progress.processedRecords > 0) {
      const avgTimePerRecord = duration / progress.processedRecords
      const remainingRecords = progress.totalRecords - progress.processedRecords
      estimatedTimeRemaining = Math.round(avgTimePerRecord * remainingRecords)
    }

    return {
      success: true,
      data: {
        ...progress,
        progressPercentage,
        duration,
        estimatedTimeRemaining,
        // Don't send all errors/warnings in progress updates to avoid large payloads
        errorCount: progress.errors.length,
        warningCount: progress.warnings.length,
        recentErrors: progress.errors.slice(-5),
        recentWarnings: progress.warnings.slice(-5),
        // Include quote-specific fields if they exist
        createdAuthors: progress.createdAuthors || 0,
        createdReferences: progress.createdReferences || 0
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get import progress'
    })
  }
})
