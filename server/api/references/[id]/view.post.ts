export default defineEventHandler(async (event) => {
  try {
    const refId = getRouterParam(event, 'id')
    if (!refId || isNaN(parseInt(refId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const db = hubDatabase()
    const session = await getUserSession(event)

    // Client metadata for anonymous tracking
    const clientIP = getRequestIP(event) || 'unknown'
    const userAgent = getHeader(event, 'user-agent') || 'unknown'

    // Ensure reference exists
    const ref = await db.prepare(`SELECT id FROM quote_references WHERE id = ?`).bind(refId).first()
    if (!ref) {
      throw createError({ statusCode: 404, statusMessage: 'Reference not found' })
    }

    // Check recent view within 1 hour by same user or anonymous IP
    const recentView = await db.prepare(`
      SELECT id FROM reference_views 
      WHERE reference_id = ?
      AND (
        (user_id = ? AND user_id IS NOT NULL) OR
        (ip_address = ? AND user_id IS NULL)
      )
      AND viewed_at > datetime('now', '-1 hour')
      LIMIT 1
    `).bind(
      refId,
      session.user?.id || null,
      clientIP
    ).first()

    let recorded = false
    if (!recentView) {
      await db.prepare(`
        INSERT INTO reference_views (reference_id, user_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `).bind(
        refId,
        session.user?.id || null,
        session.user ? null : clientIP,
        userAgent
      ).run()
      recorded = true
    }

    return { success: true, message: 'View tracked', recorded }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error tracking reference view:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to track reference view' })
  }
})
