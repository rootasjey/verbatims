import { Author } from "~/types"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const db = hubDatabase()
    
    const q = query.q as string
    const limit = Math.min(parseInt(query.limit as string) || 10, 20)
    
    if (!q || q.trim().length < 2) {
      return {
        success: true,
        data: []
      }
    }
    
    const searchTerm = `%${q.trim()}%`
    
    const authors = await db.prepare(`
      SELECT 
        id,
        name,
        is_fictional,
        job,
        image_url,
        views_count,
        likes_count
      FROM authors a
      WHERE a.name LIKE ?
      ORDER BY 
        CASE WHEN a.name LIKE ? THEN 0 ELSE 1 END,
        a.likes_count DESC,
        a.name ASC
      LIMIT ?
    `).bind(searchTerm, `${q.trim()}%`, limit).all()
    
    return {
      success: true,
      data: (authors.results || []) as unknown as Author[]
    }
  } catch (error) {
    console.error('Author search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search authors'
    })
  }
})
