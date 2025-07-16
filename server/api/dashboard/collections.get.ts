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
    
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    const db = hubDatabase()
    
    // Get user's collections with quote count
    const collections = await db.prepare(`
      SELECT 
        c.*,
        COUNT(cq.quote_id) as quotes_count
      FROM user_collections c
      LEFT JOIN collection_quotes cq ON c.id = cq.collection_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `).bind(session.user.id, limit, offset).all()
    
    // Get total count
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM user_collections
      WHERE user_id = ?
    `).bind(session.user.id).first()
    
    const total = totalResult?.total || 0
    const hasMore = offset + collections.length < total
    
    return {
      success: true,
      data: collections,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Dashboard collections error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collections'
    })
  }
})
