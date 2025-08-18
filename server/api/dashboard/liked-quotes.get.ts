export default defineEventHandler(async (event) => {
  try {
    const db = hubDatabase()
    const session = await requireUserSession(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    const likedQuotes = await db.prepare(`
      SELECT 
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        ul.created_at as liked_at,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM user_likes ul
      JOIN quotes q ON ul.likeable_id = q.id
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE ul.user_id = ? 
        AND ul.likeable_type = 'quote' 
        AND q.status = 'approved'
      GROUP BY q.id
      ORDER BY ul.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(session.user.id, limit, offset).all()

    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM user_likes ul
      JOIN quotes q ON ul.likeable_id = q.id
      WHERE ul.user_id = ? 
        AND ul.likeable_type = 'quote' 
        AND q.status = 'approved'
    `).bind(session.user.id).first()

    const total = Number(totalResult?.total) || 0
    const quotesArray = Array.isArray(likedQuotes.results) ? likedQuotes.results : []
    const hasMore = offset + quotesArray.length < total

    const processedQuotes = quotesArray.map((quote: any) => ({
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
    if (error?.statusCode) {
      throw error
    }

    console.error('Dashboard liked quotes error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch liked quotes'
    })
  }
})
