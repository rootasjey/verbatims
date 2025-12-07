export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      return {
        success: true,
        data: { isLiked: false }
      }
    }

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const db = hubDatabase()

    // Check if user has liked this author
    const like = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'author' AND likeable_id = ?
    `).bind(session.user.id, authorId).first()

    return {
      success: true,
      data: {
        isLiked: !!like
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error checking author like status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check like status'
    })
  }
})
