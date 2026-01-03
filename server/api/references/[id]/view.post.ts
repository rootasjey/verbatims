import { db, schema } from 'hub:db'
import { eq, and, or, isNotNull, isNull, gt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const refId = getRouterParam(event, 'id')
    if (!refId || isNaN(parseInt(refId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const session = await getUserSession(event)

    // Client metadata for anonymous tracking
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // Ensure reference exists
    const ref = await db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(refId)))
      .get()
      
    if (!ref) {
      throw createError({ statusCode: 404, statusMessage: 'Reference not found' })
    }

    // Check recent view within 1 hour by same user or anonymous IP
    const oneHourAgo = sql`datetime('now', '-1 hour')`
    const recentView = await db.select({ id: schema.referenceViews.id })
      .from(schema.referenceViews)
      .where(and(
        eq(schema.referenceViews.referenceId, parseInt(refId)),
        or(
          and(
            eq(schema.referenceViews.userId, session.user?.id || 0),
            isNotNull(schema.referenceViews.userId)
          ),
          and(
            eq(schema.referenceViews.ipAddress, clientIP),
            isNull(schema.referenceViews.userId)
          )
        ),
        gt(schema.referenceViews.viewedAt, oneHourAgo)
      ))
      .limit(1)
      .get()

    let recorded = false
    if (!recentView) {
      await db.insert(schema.referenceViews).values({
        referenceId: parseInt(refId),
        userId: session.user?.id || null,
        ipAddress: session.user ? null : clientIP,
        userAgent
      })
      recorded = true
    }

    return { success: true, message: 'View tracked', recorded }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error tracking reference view:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to track reference view' })
  }
})
