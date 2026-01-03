import { db, schema } from 'hub:db'
import { count, eq, sum } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    // Get basic statistics
    const stats = await Promise.all([
      db.select({ count: count() }).from(schema.quotes).where(eq(schema.quotes.status, 'approved')),
      db.select({ count: count() }).from(schema.authors),
      db.select({ count: count() }).from(schema.quoteReferences),
      db.select({ count: count() }).from(schema.users),
      db.select({ count: count() }).from(schema.tags),
      db.select({ total: sum(schema.quotes.viewsCount) }).from(schema.quotes).where(eq(schema.quotes.status, 'approved')),
      db.select({ total: sum(schema.quotes.likesCount) }).from(schema.quotes).where(eq(schema.quotes.status, 'approved'))
    ])
    
    return {
      success: true,
      data: {
        quotes: stats[0][0]?.count || 0,
        authors: stats[1][0]?.count || 0,
        references: stats[2][0]?.count || 0,
        users: stats[3][0]?.count || 0,
        tags: stats[4][0]?.count || 0,
        totalViews: Number(stats[5][0]?.total || 0),
        totalLikes: Number(stats[6][0]?.total || 0)
      }
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statistics'
    })
  }
})
