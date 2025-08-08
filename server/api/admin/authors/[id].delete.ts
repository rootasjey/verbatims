/**
 * Admin API: Delete Author
 * Deletes an author with admin authentication and proper validation
 */

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

    const db = hubDatabase()

    // Check if author exists
    const existingAuthor = await db.prepare(`
      SELECT * FROM authors WHERE id = ?
    `).bind(authorId).first()

    if (!existingAuthor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Determine strategy for related quotes
    const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

    // Count associated quotes
    const quoteCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM quotes WHERE author_id = ?
    `).bind(authorId).first()
    const quoteCount = Number(quoteCountResult?.count) || 0

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
      await db.prepare('BEGIN TRANSACTION').run()
      try {
        if (strategy === 'delete') {
          // Delete quote-related rows (quote_tags etc. are ON DELETE CASCADE)
          await db.prepare(`DELETE FROM quotes WHERE author_id = ?`).bind(authorId).run()
        } else {
          // Anonymize: set author_id to NULL
          await db.prepare(`UPDATE quotes SET author_id = NULL WHERE author_id = ?`).bind(authorId).run()
        }

        // Delete the author
        const del = await db.prepare(`DELETE FROM authors WHERE id = ?`).bind(authorId).run()
        if (!del.success) {
          throw new Error('Failed to delete author')
        }

        await db.prepare('COMMIT').run()
      } catch (txErr) {
        await db.prepare('ROLLBACK').run()
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
    const del = await db.prepare(`DELETE FROM authors WHERE id = ?`).bind(authorId).run()
    if (!del.success) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to delete author' })
    }

    return { success: true, message: 'Author deleted successfully', quotesAffected: 0 }

  } catch (error: any) {
    console.error('Error deleting author:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
