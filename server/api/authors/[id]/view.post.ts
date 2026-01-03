import { db, schema } from 'hub:db'
import { eq, and, or, isNotNull, isNull, gt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const session = await getUserSession(event)

    // Get client IP/user agent for anonymous tracking
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    const author = await db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()
      
    if (!author) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Check if this user/IP has already viewed this author recently (within 1 hour)
    const oneHourAgo = sql`datetime('now', '-1 hour')`
    const recentView = await db.select({ id: schema.authorViews.id })
      .from(schema.authorViews)
      .where(and(
        eq(schema.authorViews.authorId, parseInt(authorId)),
        or(
          and(
            eq(schema.authorViews.userId, session.user?.id || 0),
            isNotNull(schema.authorViews.userId)
          ),
          and(
            eq(schema.authorViews.ipAddress, clientIP),
            isNull(schema.authorViews.userId)
          )
        ),
        gt(schema.authorViews.viewedAt, oneHourAgo)
      ))
      .limit(1)
      .get()

    // Only track if not a recent view
    let recorded = false
    if (!recentView) {
      await db.insert(schema.authorViews).values({
        authorId: parseInt(authorId),
        userId: session.user?.id || null,
        ipAddress: session.user ? null : clientIP, // Only store IP for anonymous users
        userAgent
      })
      recorded = true
    }

    return {
      success: true,
      message: 'View tracked',
      recorded
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }

    console.error('Error tracking author view:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track author view'
    })
  }
})
