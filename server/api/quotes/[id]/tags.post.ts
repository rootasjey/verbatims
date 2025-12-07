export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }

    const body = await readBody(event)
    const { tagId, name, color } = body || {}
    if (!tagId && !name) {
      throw createError({ statusCode: 400, statusMessage: 'Provide tagId or name' })
    }

    const db = hubDatabase()

    // Check permissions: owner of draft or admin/moderator can edit tags
    const quote = await db.prepare('SELECT user_id, status FROM quotes WHERE id = ?').bind(quoteId).first()
    if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isOwnerDraft = quote.user_id === session.user.id && quote.status === 'draft'
    if (!isAdmin && !isOwnerDraft) {
      throw createError({ statusCode: 403, statusMessage: 'Not allowed to edit tags for this quote' })
    }

    let finalTagId = tagId

    if (!finalTagId) {
      // Create or find tag by name (case-insensitive)
      const existing = await db.prepare('SELECT id, name, color FROM tags WHERE LOWER(name) = LOWER(?)').bind(String(name).trim()).first()
      if (existing) {
        finalTagId = existing.id
      } else {
        const result = await db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').bind(String(name).trim(), color || '#687FE5').run()
        finalTagId = result.meta.last_row_id
      }
    }

    // Attach relation (ignore duplicates)
    await db.prepare('INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)').bind(quoteId, finalTagId).run()

    const tag = await db.prepare('SELECT id, name, color FROM tags WHERE id = ?').bind(finalTagId).first()

    return { success: true, data: tag }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error adding tag to quote:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to add tag to quote' })
  }
})
