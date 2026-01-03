import { db, schema } from 'hub:db'
import { eq, and, or, isNotNull, isNull, gt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const session = await getUserSession(event)

    // Get client IP for anonymous tracking
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // Check if quote exists and is approved
    const quote = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(quoteId)),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
    }

    // Check if this user/IP has already viewed this quote recently (within 1 hour)
    const oneHourAgo = sql`datetime('now', '-1 hour')`
    const recentView = await db.select({ id: schema.quoteViews.id })
      .from(schema.quoteViews)
      .where(and(
        eq(schema.quoteViews.quoteId, parseInt(quoteId)),
        or(
          and(
            eq(schema.quoteViews.userId, session.user?.id || 0),
            isNotNull(schema.quoteViews.userId)
          ),
          and(
            eq(schema.quoteViews.ipAddress, clientIP),
            isNull(schema.quoteViews.userId)
          )
        ),
        gt(schema.quoteViews.viewedAt, oneHourAgo)
      ))
      .limit(1)
      .get()

    // Only track if not a recent view
    if (!recentView) {
      await db.insert(schema.quoteViews).values({
        quoteId: parseInt(quoteId),
        userId: session.user?.id || null,
        ipAddress: session.user ? null : clientIP, // Only store IP for anonymous users
        userAgent
      })
    }

    return {
      success: true,
      message: 'View tracked'
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error tracking view:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track view'
    })
  }
})
