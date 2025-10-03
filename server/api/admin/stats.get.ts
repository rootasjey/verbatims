export default defineEventHandler(async (event) => {
  try {
    const { user } = await getUserSession(event)
    if (!user) { throwServer(401, 'Authentication required') }
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      throwServer(403, 'Admin or moderator access required')
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
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
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
        FROM quote_references
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
          total: Number(quotesStats?.total) || 0,
          approved: Number(quotesStats?.approved) || 0,
          draft: Number(quotesStats?.draft) || 0,
          pending: Number(quotesStats?.pending) || 0,
          rejected: Number(quotesStats?.rejected) || 0,
          featured: Number(quotesStats?.featured) || 0,
          total_likes: Number(quotesStats?.total_likes) || 0,
          total_views: Number(quotesStats?.total_views) || 0,
          total_shares: Number(quotesStats?.total_shares) || 0
        },
        users: {
          total: Number(usersStats?.total) || 0,
          active: Number(usersStats?.active) || 0,
          admins: Number(usersStats?.admins) || 0,
          moderators: Number(usersStats?.moderators) || 0,
          verified: Number(usersStats?.verified) || 0
        },
        authors: {
          total: Number(authorsStats?.total) || 0,
          fictional: Number(authorsStats?.fictional) || 0,
          total_likes: Number(authorsStats?.total_likes) || 0,
          total_views: Number(authorsStats?.total_views) || 0
        },
        references: {
          total: Number(referencesStats?.total) || 0,
          types: Number(referencesStats?.types) || 0,
          total_likes: Number(referencesStats?.total_likes) || 0,
          total_views: Number(referencesStats?.total_views) || 0
        },
        collections: {
          total: Number(collectionsStats?.total) || 0,
          public: Number(collectionsStats?.public_collections) || 0,
          avg_quotes: Math.round(Number(collectionsStats?.avg_quotes_per_collection) || 0)
        },
        likes: {
          total: Number(likesStats?.total) || 0,
          unique_users: Number(likesStats?.unique_users) || 0,
          quote_likes: Number(likesStats?.quote_likes) || 0,
          author_likes: Number(likesStats?.author_likes) || 0,
          reference_likes: Number(likesStats?.reference_likes) || 0
        },
        views: {
          total: Number(viewsStats?.total) || 0,
          unique_users: Number(viewsStats?.unique_users) || 0,
          unique_ips: Number(viewsStats?.unique_ips) || 0
        },
        recent_activity: recentActivity,
        top_contributors: topContributors
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Admin stats error:', error)
    throwServer(500, 'Failed to fetch admin statistics')
  }
})
