import { Author } from "~/types"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const db = hubDatabase()
    
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const search = query.search as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    const whereConditions = []
    const params = []
    
    if (search) {
      whereConditions.push('a.name LIKE ?')
      params.push(`%${search}%`)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    const allowedSortColumns = ['name', 'created_at', 'views_count', 'likes_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
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
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM authors a
      ${whereClause}
    `
    
    const [authors, countResult] = await Promise.all([
      db.prepare(authorsQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      success: true,
      data: authors.results as unknown as Author[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error: any) {
    console.error('Error fetching authors:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch authors'
    })
  }
})
