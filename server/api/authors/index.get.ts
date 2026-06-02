import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const search = query.search as string
    const startsWith = query.starts_with as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    const allowedSortColumns = ['name', 'created_at', 'views_count', 'likes_count', 'quotes_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Build complex query with GROUP_CONCAT using sql template
    let authorsQuery = sql`
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count,
        (
          SELECT r.id FROM ${schema.quotes} q2
          JOIN ${schema.quoteReferences} r ON r.id = q2.reference_id
          WHERE q2.author_id = a.id AND q2.status = 'approved' AND q2.reference_id IS NOT NULL
          GROUP BY q2.reference_id
          ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
          LIMIT 1
        ) AS origin_reference_id,
        (
          SELECT r.name FROM ${schema.quotes} q2
          JOIN ${schema.quoteReferences} r ON r.id = q2.reference_id
          WHERE q2.author_id = a.id AND q2.status = 'approved' AND q2.reference_id IS NOT NULL
          GROUP BY q2.reference_id
          ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
          LIMIT 1
        ) AS origin_reference_name
      FROM ${schema.authors} a
      LEFT JOIN ${schema.quotes} q ON a.id = q.author_id AND q.status = 'approved'
    `
    
    if (search || startsWith) {
      const conds = []
      if (search) conds.push(sql`a.name LIKE ${'%' + search + '%'}`)
      if (startsWith) conds.push(sql`a.name LIKE ${startsWith + '%'}`)
      authorsQuery = sql`${authorsQuery} WHERE ${sql.join(conds, sql` AND `)}`
    }
    
    authorsQuery = sql`${authorsQuery}
      GROUP BY a.id
      ORDER BY ${sortColumn === 'quotes_count' ? sql.raw('quotes_count') : sql.raw(`a.${sortColumn}`)} ${sql.raw(sortDirection)}
      LIMIT ${limit} OFFSET ${offset}
    `
    
    // Letter availability (ignores search/filters — always based on full DB)
    const lettersQuery = sql`
      SELECT DISTINCT UPPER(SUBSTR(name, 1, 1)) as letter
      FROM ${schema.authors}
      WHERE name IS NOT NULL AND name != ''
      ORDER BY letter
    `

    // Count query
    let countQuery = sql`
      SELECT COUNT(*) as total
      FROM ${schema.authors} a
    `
    
    if (search || startsWith) {
      const conds = []
      if (search) conds.push(sql`a.name LIKE ${'%' + search + '%'}`)
      if (startsWith) conds.push(sql`a.name LIKE ${startsWith + '%'}`)
      countQuery = sql`${countQuery} WHERE ${sql.join(conds, sql` AND `)}`
    }
    
    const [authors, countResult, letterResults] = await Promise.all([
      db.all(authorsQuery),
      db.get<{ total: number }>(countQuery),
      db.all<{ letter: string }>(lettersQuery)
    ])
    
    const availableLetters = (letterResults as { letter: string }[]).map(r => r.letter)
    
    const total = Number(countResult?.total) || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      success: true,
      data: authors as unknown as Author[],
      availableLetters,
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
