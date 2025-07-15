export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const db = hubDatabase()
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const search = query.search as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Build the WHERE clause
    const whereConditions = []
    const params = []
    
    if (search) {
      whereConditions.push('a.name LIKE ?')
      params.push(`%${search}%`)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Validate sort column
    const allowedSortColumns = ['name', 'created_at', 'views_count', 'likes_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Main query with quote count
    const authorsQuery = `
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count
      FROM authors a
      LEFT JOIN quotes q ON a.id = q.author_id AND q.status = 'approved'
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM authors a
      ${whereClause}
    `
    
    // Execute queries
    const [authors, countResult] = await Promise.all([
      db.prepare(authorsQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])
    
    const total = countResult?.total || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages
    
    return {
      success: true,
      data: authors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error) {
    console.error('Error fetching authors:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch authors'
    })
  }
})
