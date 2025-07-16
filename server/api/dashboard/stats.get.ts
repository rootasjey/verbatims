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
    
    const db = hubDatabase()
    
    // Get user's quote statistics
    const quoteStats = await db.prepare(`
      SELECT 
        COUNT(*) as submitted,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(likes_count) as total_likes,
        SUM(views_count) as total_views,
        SUM(shares_count) as total_shares
      FROM quotes 
      WHERE user_id = ?
    `).bind(session.user.id).first()
    
    // Get user's collections count
    const collectionsResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM user_collections
      WHERE user_id = ?
    `).bind(session.user.id).first()
    
    // Get user's likes given count
    const likesGivenResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM user_likes
      WHERE user_id = ?
    `).bind(session.user.id).first()
    
    return {
      success: true,
      data: {
        submitted: quoteStats?.submitted || 0,
        approved: quoteStats?.approved || 0,
        rejected: quoteStats?.rejected || 0,
        draft: quoteStats?.draft || 0,
        likes: quoteStats?.total_likes || 0,
        views: quoteStats?.total_views || 0,
        shares: quoteStats?.total_shares || 0,
        collections: collectionsResult?.count || 0,
        likes_given: likesGivenResult?.count || 0
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Dashboard stats error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch dashboard stats'
    })
  }
})
