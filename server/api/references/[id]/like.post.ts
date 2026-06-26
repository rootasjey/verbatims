import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const refId = getRouterParam(event, 'id')!
    if (!refId || isNaN(parseInt(refId))) {
      throwServer(400, 'Invalid reference ID')
    }

    const ref = await db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(refId!)))
      .get()

    if (!ref) throwServer(404, 'Reference not found')

    const existingLike = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, user!.id),
        eq(schema.userLikes.likeableType, 'reference'),
        eq(schema.userLikes.likeableId, parseInt(refId!))
      ))
      .get()

    let isLiked = false

    if (existingLike) {
      await db.delete(schema.userLikes)
        .where(and(
          eq(schema.userLikes.userId, user!.id),
          eq(schema.userLikes.likeableType, 'reference'),
          eq(schema.userLikes.likeableId, parseInt(refId!))
        ))
      isLiked = false
    } else {
      await db.insert(schema.userLikes).values({
        userId: user!.id,
        likeableType: 'reference',
        likeableId: parseInt(refId!)
      })
      isLiked = true
    }

    const updatedRef = await db.select({ likesCount: schema.quoteReferences.likesCount })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(refId!)))
      .get()

    if (!updatedRef) throwServer(500, 'Failed to fetch updated reference')

    return {
      success: true,
      data: {
        isLiked,
        likesCount: updatedRef!.likesCount
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error toggling reference like:', error)
    throwServer(500, 'Failed to toggle like')
  }
})
