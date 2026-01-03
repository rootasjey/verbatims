import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

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

    const ref = await db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(refId)))
      .get()

    if (!ref) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Check if user has already liked this reference
    const existingLike = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'reference'),
        eq(schema.userLikes.likeableId, parseInt(refId))
      ))
      .get()

    let isLiked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.delete(schema.userLikes)
        .where(and(
          eq(schema.userLikes.userId, session.user.id),
          eq(schema.userLikes.likeableType, 'reference'),
          eq(schema.userLikes.likeableId, parseInt(refId))
        ))
      
      isLiked = false
    } else {
      // Like - add the like
      await db.insert(schema.userLikes).values({
        userId: session.user.id,
        likeableType: 'reference',
        likeableId: parseInt(refId)
      })
      
      isLiked = true
    }

    // Get updated like count
    const updatedRef = await db.select({ likesCount: schema.quoteReferences.likesCount })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(refId)))
      .get()

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
        likesCount: updatedRef.likesCount
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error toggling reference like:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle like'
    })
  }
})
