import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

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

    // Check if user has liked this quote
    const like = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'quote'),
        eq(schema.userLikes.likeableId, parseInt(quoteId))
      ))
      .get()

    return {
      success: true,
      data: {
        isLiked: !!like
      }
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error checking like status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check like status'
    })
  }
})
