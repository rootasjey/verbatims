export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const db = hubDatabase()
    const session = await getUserSession(event)

    // Get client IP for anonymous tracking
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // Check if quote exists and is approved
    const quote = await db.prepare(`
      SELECT id FROM quotes WHERE id = ? AND status = 'approved'
    `).bind(quoteId).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
    }

    // Check if this user/IP has already viewed this quote recently (within 1 hour)
    const recentView = await db.prepare(`
      SELECT id FROM quote_views 
      WHERE quote_id = ? 
      AND (
        (user_id = ? AND user_id IS NOT NULL) OR 
        (ip_address = ? AND user_id IS NULL)
      )
      AND viewed_at > datetime('now', '-1 hour')
      LIMIT 1
    `).bind(
      quoteId, 
      session.user?.id || null, 
      clientIP
    ).first()

    // Only track if not a recent view
    if (!recentView) {
      await db.prepare(`
        INSERT INTO quote_views (quote_id, user_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `).bind(
        quoteId,
        session.user?.id || null,
        session.user ? null : clientIP, // Only store IP for anonymous users
        userAgent
      ).run()
    }

    return {
      success: true,
      message: 'View tracked'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error tracking view:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track view'
    })
  }
})
