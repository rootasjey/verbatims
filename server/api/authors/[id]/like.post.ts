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

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const db = hubDatabase()

    // Check if author exists
    const author = await db.prepare(`
      SELECT id FROM authors WHERE id = ?
    `).bind(authorId).first()

    if (!author) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Check if user has already liked this author
    const existingLike = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'author' AND likeable_id = ?
    `).bind(session.user.id, authorId).first()

    let isLiked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.prepare(`
        DELETE FROM user_likes 
        WHERE user_id = ? AND likeable_type = 'author' AND likeable_id = ?
      `).bind(session.user.id, authorId).run()
      
      isLiked = false
    } else {
      // Like - add the like
      await db.prepare(`
        INSERT INTO user_likes (user_id, likeable_type, likeable_id)
        VALUES (?, 'author', ?)
      `).bind(session.user.id, authorId).run()
      
      isLiked = true
    }

    // Get updated like count
    const updatedAuthor = await db.prepare(`
      SELECT likes_count FROM authors WHERE id = ?
    `).bind(authorId).first()

    return {
      success: true,
      data: {
        isLiked,
        likesCount: updatedAuthor.likes_count
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error toggling author like:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle like'
    })
  }
})
