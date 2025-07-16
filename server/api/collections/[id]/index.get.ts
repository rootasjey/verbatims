export default defineEventHandler(async (event) => {
  try {
    const collectionId = getRouterParam(event, 'id')
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid collection ID'
      })
    }
    
    const session = await getUserSession(event)
    const db = hubDatabase()
    
    // Get collection with user info
    const collection = await db.prepare(`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM user_collections c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(collectionId).first()
    
    if (!collection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found'
      })
    }
    
    // Check access permissions
    const canAccess = collection.is_public || 
                     (session.user && session.user.id === collection.user_id) ||
                     (session.user && (session.user.role === 'admin' || session.user.role === 'moderator'))
    
    if (!canAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }
    
    // Get quotes in collection with pagination
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    
    const quotesResult = await db.prepare(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        cq.added_at,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM collection_quotes cq
      JOIN quotes q ON cq.quote_id = q.id
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE cq.collection_id = ? AND q.status = 'approved'
      GROUP BY q.id
      ORDER BY cq.added_at DESC
      LIMIT ? OFFSET ?
    `).bind(collectionId, limit, offset).all()

    const quotes = quotesResult.results || []

    // Get total quotes count
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM collection_quotes cq
      JOIN quotes q ON cq.quote_id = q.id
      WHERE cq.collection_id = ? AND q.status = 'approved'
    `).bind(collectionId).first()

    const total = Number(totalResult?.total) || 0
    const hasMore = offset + quotes.length < total

    // Process quotes data
    const processedQuotes = quotes.map((quote: any) => ({
      ...quote,
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: quote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }))
    
    return {
      success: true,
      data: {
        ...collection,
        quotes: processedQuotes,
        quotes_count: total,
        pagination: {
          page,
          limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Collection fetch error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collection'
    })
  }
})
