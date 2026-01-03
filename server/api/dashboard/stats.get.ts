import { db, schema } from 'hub:db'
import { eq, count, sum, sql } from 'drizzle-orm'

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
    
    // Get user's quote statistics
    const quoteStatsResult = await db.select({
      submitted: count(),
      approved: sum(sql`CASE WHEN ${schema.quotes.status} = 'approved' THEN 1 ELSE 0 END`),
      rejected: sum(sql`CASE WHEN ${schema.quotes.status} = 'rejected' THEN 1 ELSE 0 END`),
      draft: sum(sql`CASE WHEN ${schema.quotes.status} = 'draft' THEN 1 ELSE 0 END`),
      pending: sum(sql`CASE WHEN ${schema.quotes.status} = 'pending' THEN 1 ELSE 0 END`),
      total_likes: sum(schema.quotes.likesCount),
      total_views: sum(schema.quotes.viewsCount),
      total_shares: sum(schema.quotes.sharesCount)
    }).from(schema.quotes).where(eq(schema.quotes.userId, session.user.id))

    const quoteStats = quoteStatsResult[0]
    
    // Get user's collections count
    const collectionsResult = await db.select({ count: count() })
      .from(schema.userCollections)
      .where(eq(schema.userCollections.userId, session.user.id))
    
    // Get user's likes given count
    const likesGivenResult = await db.select({ count: count() })
      .from(schema.userLikes)
      .where(eq(schema.userLikes.userId, session.user.id))
    
    return {
      success: true,
      data: {
        submitted: Number(quoteStats?.submitted) || 0,
        approved: Number(quoteStats?.approved) || 0,
        rejected: Number(quoteStats?.rejected) || 0,
        draft: Number(quoteStats?.draft) || 0,
        pending: Number(quoteStats?.pending) || 0,
        likes: Number(quoteStats?.total_likes) || 0,
        views: Number(quoteStats?.total_views) || 0,
        shares: Number(quoteStats?.total_shares) || 0,
        collections: Number(collectionsResult[0]?.count) || 0,
        likes_given: Number(likesGivenResult[0]?.count) || 0
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Dashboard stats error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch dashboard stats'
    })
  }
})
