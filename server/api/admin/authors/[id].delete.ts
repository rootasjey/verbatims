/**
 * Admin API: Delete Author
 * Deletes an author with admin authentication and proper validation
 */

import { db, schema } from 'hub:db'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    // Check if author exists
    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()

    if (!existingAuthor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Determine strategy for related quotes
    const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

    // Count associated quotes
    const quoteCountResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(*) as count FROM ${schema.quotes} WHERE author_id = ${parseInt(authorId)}
    `)
    const quoteCount = quoteCountResult?.count || 0

    // If there are related quotes, require a valid strategy
    if (quoteCount > 0) {
      const strategy = body?.strategy
      if (strategy !== 'delete' && strategy !== 'anonymize') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Related quotes exist. Provide strategy: "delete" or "anonymize".'
        })
      }

      // Run within a transaction for consistency
      await db.run(sql`BEGIN TRANSACTION`)
      try {
        if (strategy === 'delete') {
          // Delete quote-related rows (quote_tags etc. are ON DELETE CASCADE)
          await db.delete(schema.quotes)
            .where(eq(schema.quotes.authorId, parseInt(authorId)))
            .run()
        } else {
          // Anonymize: set author_id to NULL
          await db.update(schema.quotes)
            .set({ authorId: null })
            .where(eq(schema.quotes.authorId, parseInt(authorId)))
            .run()
        }

        // Delete the author
        await db.delete(schema.authors)
          .where(eq(schema.authors.id, parseInt(authorId)))
          .run()

        await db.run(sql`COMMIT`)
      } catch (txErr) {
        await db.run(sql`ROLLBACK`)
        throw createError({ statusCode: 500, statusMessage: 'Failed to process deletion transaction' })
      }

      return {
        success: true,
        message: 'Author deleted successfully',
        quotesAffected: quoteCount,
        strategy: body.strategy
      }
    }

    // No related quotes: simple delete
    await db.delete(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .run()

    return { success: true, message: 'Author deleted successfully', quotesAffected: 0 }

  } catch (error: any) {
    console.error('Error deleting author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
