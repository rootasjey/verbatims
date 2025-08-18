export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const refId = getRouterParam(event, 'id')
    if (!refId || isNaN(parseInt(refId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const db = hubDatabase()
    const ref = await db.prepare(`
      SELECT id FROM quote_references WHERE id = ?
    `).bind(refId).first()

    if (!ref) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Check if user has already liked this reference
    const existingLike = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'reference' AND likeable_id = ?
    `).bind(session.user.id, refId).first()

    let isLiked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.prepare(`
        DELETE FROM user_likes 
        WHERE user_id = ? AND likeable_type = 'reference' AND likeable_id = ?
      `).bind(session.user.id, refId).run()
      
      isLiked = false
    } else {
      // Like - add the like
      await db.prepare(`
        INSERT INTO user_likes (user_id, likeable_type, likeable_id)
        VALUES (?, 'reference', ?)
      `).bind(session.user.id, refId).run()
      
      isLiked = true
    }

    // Get updated like count
    const updatedRef = await db.prepare(`
      SELECT likes_count FROM quote_references WHERE id = ?
    `).bind(refId).first()

    if (!updatedRef) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch updated reference'
      })
    }

    return {
      success: true,
      data: {
        isLiked,
        likesCount: updatedRef.likes_count
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error toggling reference like:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle like'
    })
  }
})
