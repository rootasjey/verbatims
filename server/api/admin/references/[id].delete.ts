/**
 * Admin API: Delete Reference
 * Deletes a reference with admin authentication and proper validation
 */

import { db, schema } from 'hub:db'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    if (!user || user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const referenceId = getRouterParam(event, 'id')!
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throwServer(400, 'Invalid reference ID')
    }

    // Check if reference exists
    const existingReference = await db.select()
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(referenceId)))
      .get()

    if (!existingReference) {
      throwServer(404, 'Reference not found')
    }

    // Clean up R2 image if present
    if (isR2ImageUrl(existingReference.imageUrl!)) {
      await deleteImageByUrl(existingReference.imageUrl!)
    }

    // Count associated quotes
    const quoteCountResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(DISTINCT quote_id) as count FROM ${schema.quoteAttributions} WHERE reference_id = ${parseInt(referenceId)}
    `)
    const quoteCount = quoteCountResult?.count || 0

    // Determine strategy
    const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

    if (quoteCount > 0) {
      const strategy = body?.strategy
      if (strategy !== 'delete' && strategy !== 'anonymize') {
        throwServer(400, 'Related quotes exist. Provide strategy: "delete" or "anonymize".')
      }

      const statements: any[] = []
        if (strategy === 'delete') {
          statements.push(db.run(sql`
            DELETE FROM ${schema.quotes}
            WHERE id IN (SELECT quote_id FROM ${schema.quoteAttributions} WHERE reference_id = ${parseInt(referenceId)})
          `))
        } else {
          const invalid = await db.get<{ count: number }>(sql`
            SELECT COUNT(*) as count FROM ${schema.quoteAttributions}
            WHERE reference_id = ${parseInt(referenceId)} AND author_id IS NULL
          `)
          if ((invalid?.count || 0) > 0) {
            throwServer(400, 'Cannot anonymize reference-only attributions. Add an author first or use the delete strategy.')
          }
          statements.push(db.update(schema.quoteAttributions)
            .set({ referenceId: null, updatedAt: new Date() })
            .where(eq(schema.quoteAttributions.referenceId, parseInt(referenceId))))
        }

      statements.push(db.delete(schema.quoteReferences).where(eq(schema.quoteReferences.id, parseInt(referenceId))))
      await db.batch(statements as any)

      return {
        success: true,
        message: 'Reference deleted successfully',
        data: {
          quotesAffected: quoteCount,
          strategy: body.strategy
        }
      }
    }

    // No related quotes: simple delete
    await db.delete(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(referenceId)))
      .run()

    return { success: true, message: 'Reference deleted successfully', data: { quotesAffected: 0 } }

  } catch (error: any) {
    console.error('Error deleting reference:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
