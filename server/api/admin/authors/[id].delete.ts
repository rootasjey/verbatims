/**
 * Admin API: Delete Author
 * Deletes an author with admin authentication and proper validation
 */

import { db, schema } from 'hub:db'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    if (!user || user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const authorId = getRouterParam(event, 'id')!
    if (!authorId || isNaN(parseInt(authorId))) {
      throwServer(400, 'Invalid author ID')
    }

    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId!)))
      .get()

    if (!existingAuthor) {
      throwServer(404, 'Author not found')
    }

    if (isR2ImageUrl(existingAuthor.imageUrl)) {
      await deleteImageByUrl(existingAuthor.imageUrl!)
    }

    // Determine strategy for related quotes
    const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

    // Count associated quotes
    const quoteCountResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(DISTINCT quote_id) as count FROM ${schema.quoteAttributions} WHERE author_id = ${parseInt(authorId)}
    `)
    const quoteCount = quoteCountResult?.count || 0

    // If there are related quotes, require a valid strategy
    if (quoteCount > 0) {
      const strategy = body?.strategy
      if (strategy !== 'delete' && strategy !== 'anonymize') {
        throwServer(400, 'Related quotes exist. Provide strategy: "delete" or "anonymize".')
      }

      const statements: any[] = []
        if (strategy === 'delete') {
          statements.push(db.run(sql`
            DELETE FROM ${schema.quotes}
            WHERE id IN (SELECT quote_id FROM ${schema.quoteAttributions} WHERE author_id = ${parseInt(authorId)})
          `))
        } else {
          const invalid = await db.get<{ count: number }>(sql`
            SELECT COUNT(*) as count FROM ${schema.quoteAttributions}
            WHERE author_id = ${parseInt(authorId)} AND reference_id IS NULL
          `)
          if ((invalid?.count || 0) > 0) {
            throwServer(400, 'Cannot anonymize author-only attributions. Add a reference first or use the delete strategy.')
          }
          statements.push(db.update(schema.quoteAttributions)
            .set({ authorId: null, updatedAt: new Date() })
            .where(eq(schema.quoteAttributions.authorId, parseInt(authorId))))
        }

        // Delete the author
      statements.push(db.delete(schema.authors).where(eq(schema.authors.id, parseInt(authorId))))
      await db.batch(statements as any)

      return {
        success: true,
        message: 'Author deleted successfully',
        data: {
          quotesAffected: quoteCount,
          strategy: body.strategy
        }
      }
    }

    // No related quotes: simple delete
    await db.delete(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .run()

    return { success: true, message: 'Author deleted successfully', data: { quotesAffected: 0 } }

  } catch (error: any) {
    console.error('Error deleting author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
