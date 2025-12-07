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
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    const db = hubDatabase()
    
    // Get user's recent activity (likes, collections, submissions)
    const activities: Array<Record<string, any>> = []
    
    // Recent likes
    const recentLikes = await db.prepare(`
      SELECT 
        ul.created_at,
        ul.likeable_type,
        ul.likeable_id,
        CASE 
          WHEN ul.likeable_type = 'quote' THEN q.name
          WHEN ul.likeable_type = 'author' THEN a.name
          WHEN ul.likeable_type = 'reference' THEN r.name
        END as item_name,
        CASE 
          WHEN ul.likeable_type = 'quote' THEN qa.name
          WHEN ul.likeable_type = 'author' THEN NULL
          WHEN ul.likeable_type = 'reference' THEN NULL
        END as author_name
      FROM user_likes ul
      LEFT JOIN quotes q ON ul.likeable_type = 'quote' AND ul.likeable_id = q.id
      LEFT JOIN authors a ON ul.likeable_type = 'author' AND ul.likeable_id = a.id
      LEFT JOIN quote_references r ON ul.likeable_type = 'reference' AND ul.likeable_id = r.id
      LEFT JOIN authors qa ON q.author_id = qa.id
      WHERE ul.user_id = ?
      ORDER BY ul.created_at DESC
      LIMIT 10
    `).bind(session.user.id).all()
    
    const recentLikesRows = (recentLikes as any).results ?? []
    recentLikesRows.forEach((like: any) => {
      activities.push({
        type: 'like',
        action: `Liked ${like.likeable_type}`,
        item_name: like.item_name,
        author_name: like.author_name,
        item_type: like.likeable_type,
        item_id: like.likeable_id,
        created_at: like.created_at
      })
    })
    
    // Recent collection updates
    const recentCollections = await db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.created_at,
        c.updated_at,
        'collection_created' as action_type
      FROM user_collections c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `).bind(session.user.id).all()
    
    const recentCollectionsRows = (recentCollections as any).results ?? []
    recentCollectionsRows.forEach((collection: any) => {
      activities.push({
        type: 'collection',
        action: 'Created collection',
        item_name: collection.name,
        item_type: 'collection',
        item_id: collection.id,
        created_at: collection.created_at
      })
    })
    
    // Recent quote submissions
    const recentSubmissions = await db.prepare(`
      SELECT 
        q.id,
        q.name,
        q.status,
        q.created_at,
        a.name as author_name
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      WHERE q.user_id = ?
      ORDER BY q.created_at DESC
      LIMIT 10
    `).bind(session.user.id).all()
    
    const recentSubmissionsRows = (recentSubmissions as any).results ?? []
    recentSubmissionsRows.forEach((submission: any) => {
      activities.push({
        type: 'submission',
        action: `Submitted quote (${submission.status})`,
        item_name: submission.name,
        author_name: submission.author_name,
        item_type: 'quote',
        item_id: submission.id,
        status: submission.status,
        created_at: submission.created_at
      })
    })
    
    // Sort all activities by date and limit
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const paginatedActivities = activities.slice(offset, offset + limit)
    
    return {
      success: true,
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        hasMore: offset + limit < activities.length,
        totalPages: Math.ceil(activities.length / limit)
      }
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Dashboard activity error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user activity'
    })
  }
})
