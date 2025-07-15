export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      return {
        success: true,
        data: { isLiked: false }
      }
    }

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const db = hubDatabase()

    // Check if user has liked this quote
    const like = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'quote' AND likeable_id = ?
    `).bind(session.user.id, quoteId).first()

    return {
      success: true,
      data: {
        isLiked: !!like
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error checking like status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check like status'
    })
  }
})
