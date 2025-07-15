export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const db = hubDatabase()

    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100) // Max 100 per page
    const status = query.status as string || 'approved'
    const language = query.language as string
    const authorId = query.author_id ? parseInt(query.author_id as string) : null
    const referenceId = query.reference_id ? parseInt(query.reference_id as string) : null
    const search = query.search as string
    const sortBy = query.sort_by as string || 'created_at'
    const sortOrder = query.sort_order as string || 'DESC'

    const offset = (page - 1) * limit

    // Build the WHERE clause
    const whereConditions = ['q.status = ?']
    const params = [status]

    if (language) {
      whereConditions.push('q.language = ?')
      params.push(language)
    }

    if (authorId) {
      whereConditions.push('q.author_id = ?')
      params.push(authorId.toString())
    }

    if (referenceId) {
      whereConditions.push('q.reference_id = ?')
      params.push(referenceId.toString())
    }

    if (search) {
      whereConditions.push('q.name LIKE ?')
      params.push(`%${search}%`)
    }

    const whereClause = whereConditions.join(' AND ')

    // Validate sort column
    const allowedSortColumns = ['created_at', 'updated_at', 'views_count', 'likes_count', 'shares_count']
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Main query with joins
    const quotesQuery = `
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE ${whereClause}
      GROUP BY q.id
      ORDER BY q.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN references r ON q.reference_id = r.id
      WHERE ${whereClause}
    `

    // Execute queries
    const [quotes, countResult] = await Promise.all([
      db.prepare(quotesQuery).bind(...params, limit, offset).all(),
      db.prepare(countQuery).bind(...params).first()
    ])

    // Transform the results
    const transformedQuotes = quotes.map((quote: any) => ({
      id: quote.id,
      name: quote.name,
      language: quote.language,
      status: quote.status,
      views_count: quote.views_count,
      likes_count: quote.likes_count,
      shares_count: quote.shares_count,
      is_featured: quote.is_featured,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      author: quote.author_id ? {
        id: quote.author_id,
        name: quote.author_name,
        is_fictional: quote.author_is_fictional
      } : null,
      reference: quote.reference_id ? {
        id: quote.reference_id,
        name: quote.reference_name,
        type: quote.reference_type
      } : null,
      user: {
        name: quote.user_name
      },
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: quote.tag_colors.split(',')[index]
      })) : []
    }))

    const total = countResult?.total || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      success: true,
      data: transformedQuotes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error) {
    console.error('Error fetching quotes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quotes'
    })
  }
})