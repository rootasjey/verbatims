import { db, schema } from 'hub:db'
import { eq, ne, and, desc, sql } from 'drizzle-orm'

/**
 * Get similar references based on:
 * 1. Same primary type (film, book, tv_series, etc.)
 * 2. References that share quotes from same authors
 * 3. Similar secondary types or genres
 */
export default defineEventHandler(async (event) => {
  try {
    const referenceIdParam = getRouterParam(event, 'id')
    const referenceId = Number.parseInt(referenceIdParam || '', 10)
    if (!referenceIdParam || Number.isNaN(referenceId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 6, 12)

    // Get current reference details
    const currentReference = await db.select()
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, referenceId))
      .get()

    if (!currentReference) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Find similar references using a multi-factor approach
    const similarReferences = await db.all(sql`
      SELECT DISTINCT
        r.id,
        r.name,
        r.description,
        r.image_url,
        r.primary_type,
        r.secondary_type,
        r.release_date,
        r.original_language,
        r.likes_count,
        r.views_count,
        COALESCE(quotes_count.count, 0) as quotes_count,
        (
          -- Calculate similarity score
          -- Same primary type: +10 points
          CASE WHEN r.primary_type = ${currentReference.primaryType} THEN 10 ELSE 0 END +
          -- Same secondary type: +5 points
          CASE WHEN r.secondary_type IS NOT NULL AND ${currentReference.secondaryType} IS NOT NULL 
               AND LOWER(r.secondary_type) = LOWER(${currentReference.secondaryType}) THEN 5 ELSE 0 END +
          -- Has quotes from shared authors: +3 points per shared author
          COALESCE(shared_authors.shared_count * 3, 0) +
          -- Popular references get slight boost
          (r.likes_count / 100.0)
        ) as similarity_score
      FROM ${schema.quoteReferences} r
      LEFT JOIN (
        SELECT reference_id, COUNT(*) as count
        FROM ${schema.quotes}
        WHERE status = 'approved'
        GROUP BY reference_id
      ) quotes_count ON quotes_count.reference_id = r.id
      LEFT JOIN (
        -- Count shared authors between references
        SELECT 
          q2.reference_id,
          COUNT(DISTINCT q2.author_id) as shared_count
        FROM ${schema.quotes} q1
        JOIN ${schema.quotes} q2 ON q1.author_id = q2.author_id
        WHERE q1.reference_id = ${referenceId}
          AND q2.reference_id != ${referenceId}
          AND q1.status = 'approved'
          AND q2.status = 'approved'
          AND q1.author_id IS NOT NULL
        GROUP BY q2.reference_id
      ) shared_authors ON shared_authors.reference_id = r.id
      WHERE r.id != ${referenceId}
        AND quotes_count.count > 0
      ORDER BY similarity_score DESC, r.likes_count DESC, r.name ASC
      LIMIT ${limit}
    `)

    return {
      success: true,
      data: similarReferences,
      count: similarReferences.length
    }
  } catch (error: any) {
    console.error('Error fetching similar references:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch similar references'
    })
  }
})
