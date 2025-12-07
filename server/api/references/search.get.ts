import type { QuoteReference } from "~/types"

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
    
    const references = await db.prepare(`
      SELECT 
        id,
        name,
        primary_type,
        secondary_type,
        release_date,
        description,
        image_url,
        views_count,
        likes_count
      FROM quote_references r
      WHERE r.name LIKE ?
      ORDER BY 
        CASE WHEN r.name LIKE ? THEN 0 ELSE 1 END,
        r.likes_count DESC,
        r.name ASC
      LIMIT ?
    `).bind(searchTerm, `${q.trim()}%`, limit).all()
    
    return {
      success: true,
      data: (references.results || []) as unknown as QuoteReference[]
    }
  } catch (error) {
    console.error('Reference search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search references'
    })
  }
})
