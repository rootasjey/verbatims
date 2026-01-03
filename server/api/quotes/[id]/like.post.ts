import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throwServer(401, 'Authentication required')

    const quoteIdParam = getRouterParam(event, 'id')
    const quoteId = Number.parseInt(quoteIdParam || '', 10)
    if (!quoteIdParam || Number.isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

    // Check if quote exists and is approved
    const quote = await db.select({ id: schema.quotes.id, status: schema.quotes.status })
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, quoteId),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    if (!quote) throwServer(404, 'Quote not found or not approved')

    // Check if user has already liked this quote
    const existingLike = await db.select({ id: schema.userLikes.id })
      .from(schema.userLikes)
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'quote'),
        eq(schema.userLikes.likeableId, quoteId)
      ))
      .get()

    let is_liked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.delete(schema.userLikes)
        .where(and(
          eq(schema.userLikes.userId, session.user.id),
          eq(schema.userLikes.likeableType, 'quote'),
          eq(schema.userLikes.likeableId, quoteId)
        ))
      
      is_liked = false
    } else {
      // Like - add the like
      await db.insert(schema.userLikes).values({
        userId: session.user.id,
        likeableType: 'quote',
        likeableId: quoteId
      })
      
      is_liked = true
    }

    // Get updated like count
    const updatedQuote = await db.select({ likes_count: schema.quotes.likesCount })
      .from(schema.quotes)
      .where(eq(schema.quotes.id, quoteId))
      .get()
    
    if (!updatedQuote) { throwServer(500, 'Failed to retrieve updated quote'); return }

    return {
      success: true,
      data: {
        is_liked,
        likes_count: updatedQuote.likes_count
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling like:', error)
    throwServer(500, 'Failed to toggle like')
  }
})
