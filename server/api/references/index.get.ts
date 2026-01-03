import type { QuoteReference } from "~/types"
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const search = query.search as string
    const primaryType = query.primary_type as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    const allowedSortColumns = ['name', 'created_at', 'release_date', 'views_count', 'likes_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Build WHERE conditions dynamically
    let whereClause = sql``
    const conditions = []
    
    if (search) {
      conditions.push(sql`r.name LIKE ${'%' + search + '%'}`)
    }
    
    if (primaryType) {
      conditions.push(sql`r.primary_type = ${primaryType}`)
    }
    
    if (conditions.length > 0) {
      whereClause = sql` WHERE ${sql.join(conditions, sql` AND `)}`
    }
    
    const referencesQuery = sql`
      SELECT
        r.*,
        COUNT(q.id) as quotes_count
      FROM ${schema.quoteReferences} r
      LEFT JOIN ${schema.quotes} q ON r.id = q.reference_id AND q.status = 'approved'
      ${whereClause}
      GROUP BY r.id
      ORDER BY ${sql.raw(`r.${sortColumn}`)} ${sql.raw(sortDirection)}
      LIMIT ${limit} OFFSET ${offset}
    `

    const countQuery = sql`
      SELECT COUNT(*) as total
      FROM ${schema.quoteReferences} r
      ${whereClause}
    `
    
    const [references, countResult] = await Promise.all([
      db.all(referencesQuery),
      db.get<{ total: number }>(countQuery)
    ])
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages
    
    return {
      success: true,
      data: references as unknown as QuoteReference[],
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
