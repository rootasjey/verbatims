export default defineEventHandler(async () => {
  try {
    const db = hubDatabase()
    
    // Get basic statistics
    const stats = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM quotes WHERE status = ?').bind('approved').first(),
      db.prepare('SELECT COUNT(*) as count FROM authors').first(),
      db.prepare('SELECT COUNT(*) as count FROM quote_references').first(),
      db.prepare('SELECT COUNT(*) as count FROM users').first(),
      db.prepare('SELECT COUNT(*) as count FROM tags').first(),
      db.prepare('SELECT SUM(views_count) as total FROM quotes WHERE status = ?').bind('approved').first(),
      db.prepare('SELECT SUM(likes_count) as total FROM quotes WHERE status = ?').bind('approved').first()
    ])
    
    return {
      success: true,
      data: {
        quotes: stats[0]?.count || 0,
        authors: stats[1]?.count || 0,
        references: stats[2]?.count || 0,
        users: stats[3]?.count || 0,
        tags: stats[4]?.count || 0,
        totalViews: stats[5]?.total || 0,
        totalLikes: stats[6]?.total || 0
      }
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statistics'
    })
  }
})
