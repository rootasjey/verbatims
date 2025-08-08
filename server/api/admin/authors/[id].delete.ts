/**
 * Admin API: Delete Author
 * Deletes an author with admin authentication and proper validation
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

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const db = hubDatabase()

    // Check if author exists
    const existingAuthor = await db.prepare(`
      SELECT * FROM authors WHERE id = ?
    `).bind(authorId).first()

    if (!existingAuthor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Check if author has associated quotes
    const quoteCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM quotes WHERE author_id = ?
    `).bind(authorId).first()
    
    const quoteCount = Number(quoteCountResult?.count) || 0
    if (quoteCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot delete author. This author has ${quoteCount} associated quote(s). Please remove or reassign the quotes first.`
      })
    }

    // Delete the author
    const result = await db.prepare(`
      DELETE FROM authors WHERE id = ?
    `).bind(authorId).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete author'
      })
    }

    return {
      success: true,
      message: 'Author deleted successfully'
    }

  } catch (error: any) {
    console.error('Error deleting author:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
