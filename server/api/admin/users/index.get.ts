export default defineEventHandler(async (event): Promise<AdminUsersApiResponse> => {
  try {
    const session = await requireUserSession(event)
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
    
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const role = query.role as string
    const status = query.status as string
    
    const db = hubDatabase()
    
    // Build WHERE conditions
    const conditions = []
    const bindings = []
    
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ?)')
      bindings.push(`%${search}%`, `%${search}%`)
    }
    
    if (role && ['user', 'moderator', 'admin'].includes(role)) {
      conditions.push('u.role = ?')
      bindings.push(role)
    }
    
    if (status === 'active') {
      conditions.push('u.is_active = 1')
    } else if (status === 'inactive') {
      conditions.push('u.is_active = 0')
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // Get users with their statistics
    const usersResult = await db.prepare(`
      SELECT 
        u.*,
        COUNT(DISTINCT q.id) as quote_count,
        COUNT(DISTINCT CASE WHEN q.status = 'approved' THEN q.id END) as approved_quotes,
        COUNT(DISTINCT uc.id) as collection_count,
        COUNT(DISTINCT ul.id) as likes_given,
        SUM(q.likes_count) as total_likes_received
      FROM users u
      LEFT JOIN quotes q ON u.id = q.user_id
      LEFT JOIN user_collections uc ON u.id = uc.user_id
      LEFT JOIN user_likes ul ON u.id = ul.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()
    
    // Get total count
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `).bind(...bindings).first()

    const userCount = Number(usersResult.results.length) || 0
    const total = Number(totalResult?.total) || 0
    const hasMore = offset + userCount < total
    
    // Remove sensitive information for non-admin users
    const processedUsers: AdminUser[] = usersResult.results.map((user: any) => {
      const userData: any = { ...user }
      
      // Only admins can see email addresses
      if (session.user.role !== 'admin') {
        delete userData.email
      }
      
      return userData
    })
    
    return {
      success: true,
      data: processedUsers,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Admin users error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users'
    })
  }
})
