import type { CreatedQuoteResult } from "~/types"
export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin privileges
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }
    
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const status = (query.status as string) || 'pending'
    
    const db = hubDatabase()
    
    // Build WHERE conditions
    const conditions = ['q.status = ?']
    const bindings = [status]
    
    if (search) {
      conditions.push('(q.name LIKE ? OR a.name LIKE ? OR r.name LIKE ? OR u.name LIKE ?)')
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    const whereClause = `WHERE ${conditions.join(' AND ')}`
    
    // Get pending quotes with all related data
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
        u.avatar_url as user_avatar,
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
      ORDER BY q.created_at ASC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()

    const quotes = (quotesResult?.results || []) as unknown as CreatedQuoteResult[]

    // Get total count
  const totalResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
  `).bind(...bindings).first()

    const total = Number(totalResult?.total) || 0
    const hasMore = offset + quotes.length < total

    // Process quotes data
    const processedQuotes = quotes.map((quote: CreatedQuoteResult) => ({
      ...quote,
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: quote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }))
    
    return {
      success: true,
      data: processedQuotes,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Admin pending quotes error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch pending quotes'
    })
  }
})
