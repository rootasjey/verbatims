import type { QuoteReference } from "~/types"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const db = hubDatabase()
    
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const search = query.search as string
    const primaryType = query.primary_type as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Build the WHERE clause
    const whereConditions = []
    const params = []
    
    if (search) {
      whereConditions.push('r.name LIKE ?')
      params.push(`%${search}%`)
    }
    
    if (primaryType) {
      whereConditions.push('r.primary_type = ?')
      params.push(primaryType)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    const allowedSortColumns = ['name', 'created_at', 'release_date', 'views_count', 'likes_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    const referencesQuery = `
      SELECT
        r.*,
        COUNT(q.id) as quotes_count
      FROM quote_references r
      LEFT JOIN quotes q ON r.id = q.reference_id AND q.status = 'approved'
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM quote_references r
      ${whereClause}
    `
    
    const [references, countResult] = await Promise.all([
      db.prepare(referencesQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages
    
    return {
      success: true,
      data: references.results as unknown as QuoteReference[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error: any) {
    console.error('Error fetching references:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch references'
    })
  }
})
