import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import { getContentLanguage, localizeAuthors } from '~~/server/utils/entity-translations'

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
        birth_date,
        birth_year,
        birth_era,
        birth_month,
        birth_day,
        birth_is_approximate,
        birth_calendar,
        death_date,
        death_year,
        death_era,
        death_month,
        death_day,
        death_is_approximate,
        death_calendar,
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
    
    const localizedAuthors = await localizeAuthors(authors as unknown as Author[], getContentLanguage(event))
    return {
      success: true,
      data: localizedAuthors
    }
  } catch (error) {
    console.error('Author search error:', error)
    throwServer(500, 'Failed to search authors')
  }
})
