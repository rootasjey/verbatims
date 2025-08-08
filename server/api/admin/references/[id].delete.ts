/**
 * Admin API: Delete Reference
 * Deletes a reference with admin authentication and proper validation
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

    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const db = hubDatabase()

    // Check if reference exists
    const existingReference = await db.prepare(`
      SELECT * FROM quote_references WHERE id = ?
    `).bind(referenceId).first()

    if (!existingReference) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Count associated quotes
    const quoteCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM quotes WHERE reference_id = ?
    `).bind(referenceId).first()
    const quoteCount = Number(quoteCountResult?.count) || 0

    // Determine strategy
    const body = await readBody(event).catch(() => ({})) as { strategy?: 'delete' | 'anonymize' }

    if (quoteCount > 0) {
      const strategy = body?.strategy
      if (strategy !== 'delete' && strategy !== 'anonymize') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Related quotes exist. Provide strategy: "delete" or "anonymize".'
        })
      }

      await db.prepare('BEGIN TRANSACTION').run()
      try {
        if (strategy === 'delete') {
          await db.prepare(`DELETE FROM quotes WHERE reference_id = ?`).bind(referenceId).run()
        } else {
          await db.prepare(`UPDATE quotes SET reference_id = NULL WHERE reference_id = ?`).bind(referenceId).run()
        }

        const del = await db.prepare(`DELETE FROM quote_references WHERE id = ?`).bind(referenceId).run()
        if (!del.success) throw new Error('Failed to delete reference')

        await db.prepare('COMMIT').run()
      } catch (txErr) {
        await db.prepare('ROLLBACK').run()
        throw createError({ statusCode: 500, statusMessage: 'Failed to process deletion transaction' })
      }

      return {
        success: true,
        message: 'Reference deleted successfully',
        quotesAffected: quoteCount,
        strategy: body.strategy
      }
    }

    // No related quotes: simple delete
    const del = await db.prepare(`DELETE FROM quote_references WHERE id = ?`).bind(referenceId).run()
    if (!del.success) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to delete reference' })
    }

    return { success: true, message: 'Reference deleted successfully', quotesAffected: 0 }

  } catch (error: any) {
    console.error('Error deleting reference:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
