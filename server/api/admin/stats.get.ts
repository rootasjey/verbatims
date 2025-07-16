export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin privileges
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }
    
    const db = hubDatabase()
    
    // Get overall system statistics
    const [
      quotesStats,
      usersStats,
      authorsStats,
      referencesStats,
      collectionsStats,
      likesStats,
      viewsStats
    ] = await Promise.all([
      // Quotes statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured,
          SUM(likes_count) as total_likes,
          SUM(views_count) as total_views,
          SUM(shares_count) as total_shares
        FROM quotes
      `).first(),
      
      // Users statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN role = 'moderator' THEN 1 ELSE 0 END) as moderators,
          SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified
        FROM users
      `).first(),
      
      // Authors statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_fictional = 1 THEN 1 ELSE 0 END) as fictional,
          SUM(likes_count) as total_likes,
          SUM(views_count) as total_views
        FROM authors
      `).first(),
      
      // References statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT primary_type) as types,
          SUM(likes_count) as total_likes,
          SUM(views_count) as total_views
        FROM references
      `).first(),
      
      // Collections statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_collections,
          AVG(quote_count.quotes) as avg_quotes_per_collection
        FROM user_collections uc
        LEFT JOIN (
          SELECT collection_id, COUNT(*) as quotes
          FROM collection_quotes
          GROUP BY collection_id
        ) quote_count ON uc.id = quote_count.collection_id
      `).first(),
      
      // Likes statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN likeable_type = 'quote' THEN 1 END) as quote_likes,
          COUNT(CASE WHEN likeable_type = 'author' THEN 1 END) as author_likes,
          COUNT(CASE WHEN likeable_type = 'reference' THEN 1 END) as reference_likes
        FROM user_likes
      `).first(),
      
      // Views statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM quote_views
      `).first()
    ])
    
    // Get recent activity (last 30 days)
    const recentActivity = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM quotes
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all()
    
    // Get top contributors
    const topContributors = await db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        COUNT(q.id) as quote_count,
        SUM(q.likes_count) as total_likes
      FROM users u
      LEFT JOIN quotes q ON u.id = q.user_id AND q.status = 'approved'
      GROUP BY u.id
      HAVING quote_count > 0
      ORDER BY quote_count DESC, total_likes DESC
      LIMIT 10
    `).all()
    
    return {
      success: true,
      data: {
        quotes: {
          total: quotesStats?.total || 0,
          approved: quotesStats?.approved || 0,
          pending: quotesStats?.pending || 0,
          rejected: quotesStats?.rejected || 0,
          featured: quotesStats?.featured || 0,
          total_likes: quotesStats?.total_likes || 0,
          total_views: quotesStats?.total_views || 0,
          total_shares: quotesStats?.total_shares || 0
        },
        users: {
          total: usersStats?.total || 0,
          active: usersStats?.active || 0,
          admins: usersStats?.admins || 0,
          moderators: usersStats?.moderators || 0,
          verified: usersStats?.verified || 0
        },
        authors: {
          total: authorsStats?.total || 0,
          fictional: authorsStats?.fictional || 0,
          total_likes: authorsStats?.total_likes || 0,
          total_views: authorsStats?.total_views || 0
        },
        references: {
          total: referencesStats?.total || 0,
          types: referencesStats?.types || 0,
          total_likes: referencesStats?.total_likes || 0,
          total_views: referencesStats?.total_views || 0
        },
        collections: {
          total: collectionsStats?.total || 0,
          public: collectionsStats?.public_collections || 0,
          avg_quotes: Math.round(collectionsStats?.avg_quotes_per_collection || 0)
        },
        likes: {
          total: likesStats?.total || 0,
          unique_users: likesStats?.unique_users || 0,
          quote_likes: likesStats?.quote_likes || 0,
          author_likes: likesStats?.author_likes || 0,
          reference_likes: likesStats?.reference_likes || 0
        },
        views: {
          total: viewsStats?.total || 0,
          unique_users: viewsStats?.unique_users || 0,
          unique_ips: viewsStats?.unique_ips || 0
        },
        recent_activity: recentActivity,
        top_contributors: topContributors
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Admin stats error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch admin statistics'
    })
  }
})
