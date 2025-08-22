import { Author } from "~/types"

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

    // Fetch author with quote count and origin reference if any
  const author: Author | null = await db.prepare(`
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count,
        (
          SELECT r.id FROM quotes q2
          JOIN quote_references r ON r.id = q2.reference_id
          WHERE q2.author_id = a.id AND q2.status = 'approved' AND q2.reference_id IS NOT NULL
          GROUP BY q2.reference_id
          ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
          LIMIT 1
        ) AS origin_reference_id,
        (
          SELECT r.name FROM quotes q2
          JOIN quote_references r ON r.id = q2.reference_id
          WHERE q2.author_id = a.id AND q2.status = 'approved' AND q2.reference_id IS NOT NULL
          GROUP BY q2.reference_id
          ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
          LIMIT 1
        ) AS origin_reference_name
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
    let socials = [] as any[]
    try {
      socials = author && author.socials ? JSON.parse(author.socials as string) : []
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
      updated_at: author.updated_at,
      origin_reference_id: author.origin_reference_id,
      origin_reference_name: author.origin_reference_name
    }

    return {
      success: true,
      data: transformedAuthor
    }
  } catch (error: any) {
    if (error && error.statusCode) {
      throw error
    }
    
    console.error('Error fetching author:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch author'
    })
  }
})
