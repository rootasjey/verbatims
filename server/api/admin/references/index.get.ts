/**
 * Admin API: Get References
 * Retrieves references with pagination, search, and filtering for admin interface
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
    const primary_type = query.primary_type as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Build the WHERE clause
    const whereConditions = []
    const params = []
    
    if (search) {
      whereConditions.push('(r.name LIKE ? OR r.description LIKE ? OR r.secondary_type LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    if (primary_type) {
      whereConditions.push('r.primary_type = ?')
      params.push(primary_type)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Map frontend sort values to database columns
    const sortColumnMap: Record<string, string> = {
      'name': 'name',
      'created': 'created_at',
      'updated': 'updated_at',
      'release_date': 'release_date',
      'type': 'primary_type',
      'views': 'views_count',
      'likes': 'likes_count',
      'quotes': 'quotes_count'
    }

    // Validate and map sort column
    const mappedSortBy = sortColumnMap[sortBy] || sortBy
    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'release_date', 'primary_type', 'views_count', 'likes_count', 'quotes_count']
    const sortColumn = allowedSortColumns.includes(mappedSortBy) ? mappedSortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Main query with quote count
    const referencesQuery = `
      SELECT 
        r.*,
        COUNT(q.id) as quotes_count
      FROM quote_references r
      LEFT JOIN quotes q ON r.id = q.reference_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY ${sortColumn === 'quotes_count' ? 'quotes_count' : `r.${sortColumn}`} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM quote_references r
      ${whereClause}
    `
    
    // Execute queries
    const [referencesResult, countResult] = await Promise.all([
      db.prepare(referencesQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])
    
    const references = (referencesResult?.results || []).map((reference: any) => ({
      ...reference,
      urls: reference.urls ? JSON.parse(reference.urls) : {}
    }))
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      success: true,
      data: references,
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
    console.error('Error fetching references:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
