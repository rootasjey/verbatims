export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    const status = query.status as string
    
    const db = hubDatabase()
    
    // Build WHERE clause for status filter
    let whereClause = 'WHERE q.user_id = ?'
    const bindings = [session.user.id]
    
    if (status && ['draft', 'approved', 'rejected'].includes(status)) {
      whereClause += ' AND q.status = ?'
      bindings.push(status)
    }
    
    // Get user's submissions with related data
    const submissions = await db.prepare(`
      SELECT 
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        r.name as reference_name,
        r.primary_type as reference_type,
        m.name as moderator_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN references r ON q.reference_id = r.id
      LEFT JOIN users m ON q.moderator_id = m.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      ${whereClause}
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()
    
    // Get total count
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM quotes q
      ${whereClause}
    `).bind(...bindings.slice(0, -2)).first() // Remove limit and offset
    
    const total = totalResult?.total || 0
    const hasMore = offset + submissions.length < total
    
    // Process submissions data
    const processedSubmissions = submissions.map(submission => ({
      ...submission,
      tags: submission.tag_names ? submission.tag_names.split(',').map((name, index) => ({
        name,
        color: submission.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }))
    
    return {
      success: true,
      data: processedSubmissions,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Dashboard submissions error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch submissions'
    })
  }
})
