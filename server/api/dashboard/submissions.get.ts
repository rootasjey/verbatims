export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await requireUserSession(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 100)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    const status = query.status as string
    
    const db = hubDatabase()
    
    // Build WHERE clause for status filter
    let whereClause = 'WHERE q.user_id = ?'
    const bindings: any[] = [session.user.id]

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) {
      whereClause += ' AND q.status = ?'
      bindings.push(status)
    }

    // Get user's submissions with related data
    const submissionsResult = await db.prepare(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        r.name as reference_name,
        r.primary_type as reference_type,
        m.name as moderator_name
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users m ON q.moderator_id = m.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all()

    // Extract the actual results from the wrapped response
    const submissions = submissionsResult?.results || []
    
    // Get total count (exclude limit and offset from bindings)
    const countBindings = bindings.slice(0, status ? 2 : 1) // Only user_id and optionally status
    const totalResultWrapper = await db.prepare(`
      SELECT COUNT(*) as total
      FROM quotes q
      ${whereClause}
    `).bind(...countBindings).first()

    const total = Number(totalResultWrapper?.total) || 0
    const submissionsArray = Array.isArray(submissions) ? submissions : []
    const hasMore = offset + submissionsArray.length < total

    // Get tags for each submission
    const processedSubmissions = await Promise.all(submissionsArray.map(async (submission: any) => {
      // Get tags for this quote
      const tagsResult = await db.prepare(`
        SELECT t.id, t.name, t.color
        FROM tags t
        JOIN quote_tags qt ON t.id = qt.tag_id
        WHERE qt.quote_id = ?
      `).bind(submission.id).all()

      // Extract the actual tags from the wrapped response
      const tags = tagsResult?.results || []

      return {
        ...submission,
        author: submission.author_name ? {
          name: submission.author_name,
          is_fictional: submission.author_is_fictional
        } : null,
        reference: submission.reference_name ? {
          name: submission.reference_name,
          primary_type: submission.reference_type
        } : null,
        tags: tags
      }
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
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    console.error('Dashboard submissions error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch submissions'
    })
  }
})
