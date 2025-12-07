export default defineEventHandler(async (event) => {
  try {
    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const db = hubDatabase()
    const session = await getUserSession(event)

    // Get client IP/user agent for anonymous tracking
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    const author = await db.prepare(`SELECT id FROM authors WHERE id = ?`).bind(authorId).first()
    if (!author) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Check if this user/IP has already viewed this author recently (within 1 hour)
    const recentView = await db.prepare(`
      SELECT id FROM author_views 
      WHERE author_id = ? 
      AND (
        (user_id = ? AND user_id IS NOT NULL) OR 
        (ip_address = ? AND user_id IS NULL)
      )
      AND viewed_at > datetime('now', '-1 hour')
      LIMIT 1
    `).bind(
      authorId,
      session.user?.id || null,
      clientIP
    ).first()

    // Only track if not a recent view
    let recorded = false
    if (!recentView) {
      await db.prepare(`
        INSERT INTO author_views (author_id, user_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `).bind(
        authorId,
        session.user?.id || null,
        session.user ? null : clientIP, // Only store IP for anonymous users
        userAgent
      ).run()
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
