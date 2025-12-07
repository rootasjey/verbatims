import { transformAdminQuotes } from '~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    // Auth: admin or moderator
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const db = hubDatabase()
    const query = getQuery(event)

    const page = Math.max(parseInt(query.page as string) || 1, 1)
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const offset = (page - 1) * limit

    const status = (query.status as string) || 'approved'
    const language = (query.language as string) || ''
    const search = (query.search as string) || ''

    // WHERE conditions and bindings
    const conditions: string[] = ['q.status = ?']
    const bindings: any[] = [status]

    if (language) {
      conditions.push('q.language = ?')
      bindings.push(language)
    }

    if (search) {
      conditions.push('(q.name LIKE ? OR a.name LIKE ? OR r.name LIKE ? OR u.name LIKE ?)')
      const like = `%${search}%`
      bindings.push(like, like, like, like)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Main query with joins for admin view
    const quotesResult = await db.prepare(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url,
        m.name as moderator_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN users m ON q.moderator_id = m.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      ${whereClause}
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()

    const quotes = (quotesResult?.results || []) as any[]

    // Count query
    const totalRow = await db.prepare(`
      SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
    `).bind(...bindings).first()

    const total = Number(totalRow?.total) || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const data = transformAdminQuotes(quotes)

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Admin quotes index error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch admin quotes' })
  }
})
