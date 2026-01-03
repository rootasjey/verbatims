import type { QuoteReference } from "~/types"
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

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
    
    const references = await db.all(sql`
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
      FROM ${schema.quoteReferences} r
      WHERE r.name LIKE ${searchTerm}
      ORDER BY 
        CASE WHEN r.name LIKE ${startsWith} THEN 0 ELSE 1 END,
        r.likes_count DESC,
        r.name ASC
      LIMIT ${limit}
    `)
    
    return {
      success: true,
      data: references as unknown as QuoteReference[]
    }
  } catch (error) {
    console.error('Reference search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search references'
    })
  }
})
