export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throwServer(401, 'Authentication required')

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) throwServer(400, 'Invalid quote ID')

    const db = hubDatabase()

    // Check if quote exists and is approved
    const quote = await db.prepare(`
      SELECT id, status FROM quotes WHERE id = ? AND status = 'approved'
    `).bind(quoteId).first()

    if (!quote) throwServer(404, 'Quote not found or not approved')

    // Check if user has already liked this quote
    const existingLike = await db.prepare(`
      SELECT id FROM user_likes 
      WHERE user_id = ? AND likeable_type = 'quote' AND likeable_id = ?
    `).bind(session.user.id, quoteId).first()

    let is_liked = false

    if (existingLike) {
      // Unlike - remove the like
      await db.prepare(`
        DELETE FROM user_likes 
        WHERE user_id = ? AND likeable_type = 'quote' AND likeable_id = ?
      `).bind(session.user.id, quoteId).run()
      
      is_liked = false
    } else {
      // Like - add the like
      await db.prepare(`
        INSERT INTO user_likes (user_id, likeable_type, likeable_id)
        VALUES (?, 'quote', ?)
      `).bind(session.user.id, quoteId).run()
      
      is_liked = true
    }

    // Get updated like count
    const updatedQuote = await db.prepare(`
      SELECT likes_count FROM quotes WHERE id = ?
    `).bind(quoteId).first()
    
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
