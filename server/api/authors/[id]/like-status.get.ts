import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

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

    // Check if user has liked this author
    const like = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'author'),
        eq(schema.userLikes.likeableId, parseInt(authorId))
      ))
      .get()

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
