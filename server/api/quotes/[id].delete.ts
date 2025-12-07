/**
 * API: Delete Quote
 * Deletes a quote by ID (only drafts can be deleted by regular users, admins can delete any quote)
 */

export default defineEventHandler(async (event) => {
  try {
    // Get quote ID from URL
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote ID is required'
      })
    }

    // Get user session
    const { user } = await requireUserSession(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Connect to database
    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Check if quote exists and belongs to user
    const quote = await db.prepare(`
      SELECT id, user_id, status FROM quotes WHERE id = ?
    `).bind(quoteId).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found'
      })
    }

    // Check permissions: regular users can only delete their own drafts
    // Admins and moderators can delete any quote
    const isAdmin = user.role === 'admin' || user.role === 'moderator'
    const isOwner = quote.user_id === user.id
    const isDraft = quote.status === 'draft'

    if (!isAdmin && (!isOwner || !isDraft)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete your own draft quotes'
      })
    }

    // Delete quote
    const result = await db.prepare(`
      DELETE FROM quotes WHERE id = ?
    `).bind(quoteId).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete quote'
      })
    }

    return {
      success: true,
      message: 'Quote deleted successfully'
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Delete quote error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete quote'
    })
  }
})