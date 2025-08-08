/**
 * Admin API: Get Authors
 * Retrieves authors with pagination, search, and filtering for admin interface
 */

export default defineEventHandler(async (event) => {
  try {
    // Check admin authentication
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const query = getQuery(event)
    const db = hubDatabase()
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const search = query.search as string
    const is_fictional = query.is_fictional as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Build the WHERE clause
    const whereConditions = []
    const params = []
    
    if (search) {
      whereConditions.push('(a.name LIKE ? OR a.job LIKE ? OR a.description LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    if (is_fictional !== undefined && is_fictional !== '') {
      whereConditions.push('a.is_fictional = ?')
      params.push(is_fictional === 'true' ? 1 : 0)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Validate sort column
    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'views_count', 'likes_count', 'quotes_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Main query with quote count
    const authorsQuery = `
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count
      FROM authors a
      LEFT JOIN quotes q ON a.id = q.author_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY ${sortColumn === 'quotes_count' ? 'quotes_count' : `a.${sortColumn}`} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM authors a
      ${whereClause}
    `
    
    // Execute queries
    const [authorsResult, countResult] = await Promise.all([
      db.prepare(authorsQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])
    
    const authors = (authorsResult?.results || []).map((author: any) => ({
      ...author,
      socials: author.socials ? JSON.parse(author.socials) : {}
    }))
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      success: true,
      data: authors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

  } catch (error: any) {
    console.error('Error fetching authors:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
