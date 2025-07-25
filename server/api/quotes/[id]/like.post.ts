export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const db = hubDatabase()

    // Check if quote exists and is approved
    const quote = await db.prepare(`
      SELECT id, status FROM quotes WHERE id = ? AND status = 'approved'
    `).bind(quoteId).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
    }

    // Check if user has already liked this quote
    const existingLike = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'quote' AND likeable_id = ?
    `).bind(session.user.id, quoteId).first()

    let isLiked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.prepare(`
        DELETE FROM user_likes 
        WHERE user_id = ? AND likeable_type = 'quote' AND likeable_id = ?
      `).bind(session.user.id, quoteId).run()
      
      isLiked = false
    } else {
      // Like - add the like
      await db.prepare(`
        INSERT INTO user_likes (user_id, likeable_type, likeable_id)
        VALUES (?, 'quote', ?)
      `).bind(session.user.id, quoteId).run()
      
      isLiked = true
    }

    // Get updated like count
    const updatedQuote = await db.prepare(`
      SELECT likes_count FROM quotes WHERE id = ?
    `).bind(quoteId).first()

    return {
      success: true,
      data: {
        isLiked,
        likesCount: updatedQuote.likes_count
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error toggling like:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle like'
    })
  }
})
