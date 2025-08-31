export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const query = getQuery(event)
    const db = hubDatabase()

    const page = parseInt(String(query.page || '1')) || 1
    const limit = Math.min(parseInt(String(query.limit || '50')) || 50, 100)
    const search = (query.search as string) || ''
    const sortByRaw = (query.sort_by as string) || 'name'
    const sortOrderRaw = ((query.sort_order as string) || 'ASC').toUpperCase()
    const sortOrder = sortOrderRaw === 'DESC' ? 'DESC' : 'ASC'

    const allowedSort: Record<string, string> = {
      name: 't.name',
      created_at: 't.created_at',
      quotes: 'quotes_count'
    }
    
    const sortColumn = allowedSort[sortByRaw] || 't.name'
    const offset = (page - 1) * limit
    const whereClauses: string[] = []
    const params: any[] = []

    if (search) {
      whereClauses.push('(t.name LIKE ? OR t.description LIKE ? OR t.category LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const listSQL = `
      SELECT 
        t.id, t.name, t.description, t.category, t.color, t.created_at, t.updated_at,
        COUNT(qt.quote_id) as quotes_count
      FROM tags t
      LEFT JOIN quote_tags qt ON t.id = qt.tag_id
      ${whereSQL}
      GROUP BY t.id
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `

    const countSQL = `
      SELECT COUNT(*) as total
      FROM tags t
      ${whereSQL}
    `

    const [rowsResult, countRow] = await Promise.all([
      db.prepare(listSQL).bind(...params, limit, offset).all(),
      db.prepare(countSQL).bind(...params).first()
    ])

    const rows = rowsResult?.results || []
    const total = Number(countRow?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages }
    }
  } catch (error) {
    console.error('Error fetching admin tags:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tags' })
  }
})
