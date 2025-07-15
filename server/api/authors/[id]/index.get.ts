export default defineEventHandler(async (event) => {
  try {
    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const db = hubDatabase()

    // Fetch author with quote count
    const author = await db.prepare(`
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count
      FROM authors a
      LEFT JOIN quotes q ON a.id = q.author_id AND q.status = 'approved'
      WHERE a.id = ?
      GROUP BY a.id
    `).bind(authorId).first()

    if (!author) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Parse JSON fields
    let socials = []
    try {
      socials = author.socials ? JSON.parse(author.socials) : []
    } catch (error) {
      console.error('Failed to parse author socials:', error)
    }

    // Transform the result
    const transformedAuthor = {
      id: author.id,
      name: author.name,
      is_fictional: author.is_fictional,
      birth_date: author.birth_date,
      birth_location: author.birth_location,
      death_date: author.death_date,
      death_location: author.death_location,
      job: author.job,
      description: author.description,
      image_url: author.image_url,
      socials,
      views_count: author.views_count,
      likes_count: author.likes_count,
      shares_count: author.shares_count,
      quotes_count: author.quotes_count,
      created_at: author.created_at,
      updated_at: author.updated_at
    }

    return {
      success: true,
      data: transformedAuthor
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error fetching author:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch author'
    })
  }
})
