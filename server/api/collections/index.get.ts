export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const session = await getUserSession(event)
    
    const db = hubDatabase()
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const userId = query.user_id as string
    const publicOnly = query.public === 'true'
    const sort = query.sort as string || 'updated_at'
    const order = query.order as string || 'desc'
    
    // Build WHERE conditions
    const conditions = []
    const bindings = []
    
    if (search) {
      conditions.push('(c.name LIKE ? OR c.description LIKE ?)')
      bindings.push(`%${search}%`, `%${search}%`)
    }
    
    if (userId) {
      conditions.push('c.user_id = ?')
      bindings.push(userId)
    }
    
    if (publicOnly) {
      conditions.push('c.is_public = 1')
    } else if (!session.user) {
      // Non-authenticated users can only see public collections
      conditions.push('c.is_public = 1')
    } else if (!userId) {
      // If no specific user requested, show public collections and user's own
      conditions.push('(c.is_public = 1 OR c.user_id = ?)')
      bindings.push(session.user.id)
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Validate sort column
    const validSortColumns = ['created_at', 'updated_at', 'name', 'quotes_count']
    const sortColumn = validSortColumns.includes(sort) ? sort : 'updated_at'
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    // Handle quotes_count sorting (need to use COUNT result)
    const orderByClause = sortColumn === 'quotes_count'
      ? `ORDER BY quotes_count ${sortOrder}, c.updated_at DESC`
      : `ORDER BY c.${sortColumn} ${sortOrder}`

    // Get collections with quote count and user info
    const collections = await db.prepare(`
      SELECT
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        COUNT(cq.quote_id) as quotes_count
      FROM user_collections c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN collection_quotes cq ON c.id = cq.collection_id
      ${whereClause}
      GROUP BY c.id
      ${orderByClause}
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()
    
    // Get total count for pagination
    const totalResult = await db.prepare(`
      SELECT COUNT(DISTINCT c.id) as total
      FROM user_collections c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
    `).bind(...bindings.slice(0, -2)).first() // Remove limit and offset from bindings
    
    const total = Number(totalResult?.total) || 0
    // D1 `.all()` returns an object with a `results` array, so normalize to rows
    const rows = (collections as any).results ?? []
    const hasMore = offset + rows.length < total
    
    return {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Collections fetch error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collections'
    })
  }
})
