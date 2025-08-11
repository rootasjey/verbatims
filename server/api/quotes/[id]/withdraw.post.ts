export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session?.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const idParam = getRouterParam(event, 'id')
    if (!idParam || isNaN(parseInt(idParam))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }
    const quoteId = Number(idParam)

    const db = hubDatabase()

    // Ensure the quote exists, belongs to the user, and is currently pending
    const quote = await db.prepare(
      `SELECT id FROM quotes WHERE id = ? AND user_id = ? AND status = 'pending'`
    ).bind(quoteId, session.user.id).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found, not pending, or you do not have permission to withdraw it'
      })
    }

    // Move back to draft and clear moderation fields
    const result = await db.prepare(
      `UPDATE quotes
       SET status = 'draft',
           moderator_id = NULL,
           moderated_at = NULL,
           rejection_reason = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND status = 'pending'`
    ).bind(quoteId, session.user.id).run()

    const changes = (result as any)?.meta?.changes ?? 0

    return {
      success: true,
      updatedCount: changes,
      updatedIds: [quoteId],
      skippedIds: [],
      message: 'Quote withdrawn to drafts'
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Withdraw quote error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to withdraw quote' })
  }
})
