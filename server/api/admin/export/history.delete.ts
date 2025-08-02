/**
 * Admin API: Delete Export History Entry
 * Deletes a specific export history entry by ID
 */

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const body = await readBody(event)
    const { exportId } = body

    if (!exportId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Export ID is required'
      })
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Check if export exists
    const existingExport = await db.prepare(`
      SELECT export_id FROM quotes_export_logs 
      WHERE export_id = ?
    `).bind(exportId).first()

    if (!existingExport) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Export history entry not found'
      })
    }

    // Delete the export history entry
    const result = await db.prepare(`
      DELETE FROM quotes_export_logs 
      WHERE export_id = ?
    `).bind(exportId).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete export history entry'
      })
    }

    return {
      success: true,
      message: 'Export history entry deleted successfully'
    }

  } catch (error: any) {
    console.error('Delete export history error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to delete export history entry'
    })
  }
})
