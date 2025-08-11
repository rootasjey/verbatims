export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session || !session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event)

    if (!body.quote_ids || !Array.isArray(body.quote_ids) || body.quote_ids.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Quote IDs array is required' })
    }

    if (body.quote_ids.length > 50) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot submit more than 50 quotes at once' })
    }

    // Normalize and validate IDs
    const quoteIds: number[] = body.quote_ids.map((id: string | number) => {
      const numId = typeof id === 'number' ? id : parseInt(id)
      if (isNaN(numId)) {
        throw createError({ statusCode: 400, statusMessage: 'All quote IDs must be valid numbers' })
      }
      return numId
    })

    const db = hubDatabase()

    // Check existence and draft status
    const placeholders = quoteIds.map(() => '?').join(',')
    const quotesResult = await db.prepare(`
      SELECT id, name FROM quotes
      WHERE id IN (${placeholders}) AND status = 'draft'
    `).bind(...quoteIds).all()

    const existing = (quotesResult?.results || []) as { id: number; name: string }[]
    if (existing.length !== quoteIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'Some quotes not found or not drafts' })
    }

    // Minimum content validation similar to single submit
    const invalid = existing.find(q => !q.name || String(q.name).trim().length < 2)
    if (invalid) {
      throw createError({ statusCode: 400, statusMessage: 'All quotes must have at least 2 characters before submission' })
    }

    await Promise.all(quoteIds.map(id =>
      db.prepare(`
        UPDATE quotes
        SET status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(id).run()
    ))

    return {
      success: true,
      data: {
        processed_count: quoteIds.length,
        quote_ids: quoteIds
      },
      message: `${quoteIds.length} draft${quoteIds.length > 1 ? 's' : ''} submitted for review`
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Bulk submit drafts error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit drafts for review' })
  }
})
