export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

    const quoteId = getRouterParam(event, 'id')
    const tagId = getRouterParam(event, 'tagId')
    if (!quoteId || isNaN(parseInt(quoteId)) || !tagId || isNaN(parseInt(tagId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid identifiers' })
    }

    const db = hubDatabase()
    const quote = await db.prepare('SELECT user_id, status FROM quotes WHERE id = ?').bind(quoteId).first()
    if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })

    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isOwnerDraft = quote.user_id === session.user.id && quote.status === 'draft'
    if (!isAdmin && !isOwnerDraft) {
      throw createError({ statusCode: 403, statusMessage: 'Not allowed to edit tags for this quote' })
    }

    await db.prepare('DELETE FROM quote_tags WHERE quote_id = ? AND tag_id = ?').bind(quoteId, tagId).run()
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error removing tag from quote:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove tag from quote' })
  }
})
