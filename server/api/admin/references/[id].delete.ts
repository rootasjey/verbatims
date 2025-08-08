/**
 * Admin API: Delete Reference
 * Deletes a reference with admin authentication and proper validation
 */

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const db = hubDatabase()

    // Check if reference exists
    const existingReference = await db.prepare(`
      SELECT * FROM quote_references WHERE id = ?
    `).bind(referenceId).first()

    if (!existingReference) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Check if reference has associated quotes
    const quoteCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM quotes WHERE reference_id = ?
    `).bind(referenceId).first()
    
    const quoteCount = Number(quoteCountResult?.count) || 0
    if (quoteCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot delete reference. This reference has ${quoteCount} associated quote(s). Please remove or reassign the quotes first.`
      })
    }

    // Delete the reference
    const result = await db.prepare(`
      DELETE FROM quote_references WHERE id = ?
    `).bind(referenceId).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete reference'
      })
    }

    return {
      success: true,
      message: 'Reference deleted successfully'
    }

  } catch (error: any) {
    console.error('Error deleting reference:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
