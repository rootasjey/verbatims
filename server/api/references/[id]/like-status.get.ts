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

    const refId = getRouterParam(event, 'id')!
    if (!refId || isNaN(parseInt(refId))) {
      throwServer(400, 'Invalid reference ID')
    }

    // Check if user has liked this reference
    const like = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'reference'),
        eq(schema.userLikes.likeableId, parseInt(refId))
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

    console.error('Error checking reference like status:', error)
    throwServer(500, 'Failed to check like status')
  }
})
