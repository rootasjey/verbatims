/**
 * Admin API: List Import History
 * Returns a list of all imports with their status and summary information
 */

import { importProgressStore } from './references.post'

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
    const status = query.status as string

    // Get all imports from store
    const allImports = Array.from(importProgressStore.values())
    
    // Filter by status if specified
    let filteredImports = allImports
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      filteredImports = allImports.filter(imp => imp.status === status)
    }

    // Sort by start time (newest first)
    filteredImports.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

    // Apply pagination
    const paginatedImports = filteredImports.slice(offset, offset + limit)

    // Transform data for response
    const imports = paginatedImports.map(imp => {
      const duration = imp.completedAt 
        ? imp.completedAt.getTime() - imp.startedAt.getTime()
        : Date.now() - imp.startedAt.getTime()

      const progressPercentage = imp.totalRecords > 0 
        ? Math.round((imp.processedRecords / imp.totalRecords) * 100)
        : 0

      return {
        id: imp.id,
        status: imp.status,
        totalRecords: imp.totalRecords,
        processedRecords: imp.processedRecords,
        successfulRecords: imp.successfulRecords,
        failedRecords: imp.failedRecords,
        errorCount: imp.errors.length,
        warningCount: imp.warnings.length,
        progressPercentage,
        duration,
        startedAt: imp.startedAt,
        completedAt: imp.completedAt
      }
    })

    // Calculate summary statistics
    const summary = {
      total: allImports.length,
      pending: allImports.filter(imp => imp.status === 'pending').length,
      processing: allImports.filter(imp => imp.status === 'processing').length,
      completed: allImports.filter(imp => imp.status === 'completed').length,
      failed: allImports.filter(imp => imp.status === 'failed').length,
      totalRecordsImported: allImports
        .filter(imp => imp.status === 'completed')
        .reduce((sum, imp) => sum + imp.successfulRecords, 0)
    }

    return {
      success: true,
      data: {
        imports,
        summary,
        pagination: {
          limit,
          offset,
          total: filteredImports.length,
          hasMore: offset + limit < filteredImports.length
        }
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to list imports'
    })
  }
})
