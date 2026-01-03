import type { Author } from "~/types"
import { db, schema } from 'hub:db'
import { like, desc, asc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    const q = query.q as string
    const limit = Math.min(parseInt(query.limit as string) || 10, 20)
    
    if (!q || q.trim().length < 2) {
      return {
        success: true,
        data: []
      }
    }
    
    const searchTerm = `%${q.trim()}%`
    const startsWith = `${q.trim()}%`
    
    const authors = await db.all(sql`
      SELECT 
        id,
        name,
        is_fictional,
        job,
        image_url,
        views_count,
        likes_count
      FROM ${schema.authors} a
      WHERE a.name LIKE ${searchTerm}
      ORDER BY 
        CASE WHEN a.name LIKE ${startsWith} THEN 0 ELSE 1 END,
        a.likes_count DESC,
        a.name ASC
      LIMIT ${limit}
    `)
    
    return {
      success: true,
      data: authors as unknown as Author[]
    }
  } catch (error) {
    console.error('Author search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search authors'
    })
  }
})
