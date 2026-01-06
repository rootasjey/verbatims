import { db, schema } from 'hub:db'
import { eq, ne, and, desc, sql } from 'drizzle-orm'

/**
 * Get similar authors based on:
 * 1. Same fictional status (fictional vs real person)
 * 2. Authors who share quotes from same references
 * 3. Authors with similar job/profession
 */
export default defineEventHandler(async (event) => {
  try {
    const authorIdParam = getRouterParam(event, 'id')
    const authorId = Number.parseInt(authorIdParam || '', 10)
    if (!authorIdParam || Number.isNaN(authorId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 6, 12)

    // Get current author details
    const currentAuthor = await db.select()
      .from(schema.authors)
      .where(eq(schema.authors.id, authorId))
      .get()

    if (!currentAuthor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Find similar authors using a multi-factor approach
    const similarAuthors = await db.all(sql`
      SELECT DISTINCT
        a.id,
        a.name,
        a.job,
        a.description,
        a.image_url,
        a.is_fictional,
        a.birth_date,
        a.death_date,
        a.likes_count,
        a.views_count,
        COALESCE(quotes_count.count, 0) as quotes_count,
        (
          -- Calculate similarity score
          -- Same fictional status: +10 points
          CASE WHEN a.is_fictional = ${currentAuthor.isFictional ? 1 : 0} THEN 10 ELSE 0 END +
          -- Same job/profession: +5 points
          CASE WHEN a.job IS NOT NULL AND ${currentAuthor.job} IS NOT NULL 
               AND LOWER(a.job) = LOWER(${currentAuthor.job}) THEN 5 ELSE 0 END +
          -- Has quotes from shared references: +3 points per shared reference
          COALESCE(shared_refs.shared_count * 3, 0) +
          -- Popular authors get slight boost
          (a.likes_count / 100.0)
        ) as similarity_score
      FROM ${schema.authors} a
      LEFT JOIN (
        SELECT author_id, COUNT(*) as count
        FROM ${schema.quotes}
        WHERE status = 'approved'
        GROUP BY author_id
      ) quotes_count ON quotes_count.author_id = a.id
      LEFT JOIN (
        -- Count shared references between authors
        SELECT 
          q2.author_id,
          COUNT(DISTINCT q2.reference_id) as shared_count
        FROM ${schema.quotes} q1
        JOIN ${schema.quotes} q2 ON q1.reference_id = q2.reference_id
        WHERE q1.author_id = ${authorId}
          AND q2.author_id != ${authorId}
          AND q1.status = 'approved'
          AND q2.status = 'approved'
          AND q1.reference_id IS NOT NULL
        GROUP BY q2.author_id
      ) shared_refs ON shared_refs.author_id = a.id
      WHERE a.id != ${authorId}
        AND quotes_count.count > 0
      ORDER BY similarity_score DESC, a.likes_count DESC, a.name ASC
      LIMIT ${limit}
    `)

    return {
      success: true,
      data: similarAuthors,
      count: similarAuthors.length
    }
  } catch (error: any) {
    console.error('Error fetching similar authors:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch similar authors'
    })
  }
})
