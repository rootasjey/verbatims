import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const search = query.search as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Validate sort column
    const allowedSortColumns = ['name', 'created_at']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Build WHERE clause
    let whereClause = sql``
    if (search) {
      whereClause = sql` WHERE t.name LIKE ${'%' + search + '%'}`
    }
    
    // Main query with quote count
    const tagsQuery = sql`
      SELECT 
        t.*,
        COUNT(qt.quote_id) as quotes_count
      FROM ${schema.tags} t
      LEFT JOIN ${schema.quoteTags} qt ON t.id = qt.tag_id
      LEFT JOIN ${schema.quotes} q ON qt.quote_id = q.id AND q.status = 'approved'
      ${whereClause}
      GROUP BY t.id
      ORDER BY ${sql.raw(`t.${sortColumn}`)} ${sql.raw(sortDirection)}
      LIMIT ${limit} OFFSET ${offset}
    `
    
    // Count query for pagination
    const countQuery = sql`
      SELECT COUNT(*) as total
      FROM ${schema.tags} t
      ${whereClause}
    `
    
    // Execute queries
    const [tags, countResult] = await Promise.all([
      db.all(tagsQuery),
      db.get<{ total: number }>(countQuery)
    ])
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(Number(total) / limit)
    const hasMore = page < totalPages
    
    return {
      success: true,
      data: tags,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tags'
    })
  }
})
