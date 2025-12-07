export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      return {
        success: true,
        data: { isLiked: false }
      }
    }

    const refId = getRouterParam(event, 'id')
    if (!refId || isNaN(parseInt(refId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const db = hubDatabase()

    // Check if user has liked this reference
    const like = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'reference' AND likeable_id = ?
    `).bind(session.user.id, refId).first()

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

    console.error('Error checking reference like status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check like status'
    })
  }
})
