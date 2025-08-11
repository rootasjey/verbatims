export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session?.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const body = await readBody(event)

    // Accept either a single id or an array of ids
    let ids: number[] = []
    if (Array.isArray(body?.ids)) {
      ids = body.ids.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n))
    } else if (body?.id != null) {
      const n = Number(body.id)
      if (Number.isInteger(n)) ids = [n]
    }

    ids = Array.from(new Set(ids))
    if (ids.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'At least one valid quote id is required' })
    }
    if (ids.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'You can withdraw at most 200 quotes at a time' })
    }

    const db = hubDatabase()

    // Only allow withdrawing quotes owned by the user and currently pending
    const placeholders = ids.map(() => '?').join(',')
    const existing = await db.prepare(
      `SELECT id FROM quotes WHERE id IN (${placeholders}) AND user_id = ? AND status = 'pending'`
    ).bind(...ids, session.user.id).all()

    const rows = (existing?.results || []) as Array<{ id: number }>
    const updatableIds = rows.map(r => r.id)
    const skippedIds = ids.filter(id => !updatableIds.includes(id))

    if (updatableIds.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        updatedIds: [],
        skippedIds,
        message: 'No pending quotes to withdraw'
      }
    }

    const updPlaceholders = updatableIds.map(() => '?').join(',')
    const updateResult = await db.prepare(
      `UPDATE quotes
       SET status = 'draft',
           moderator_id = NULL,
           moderated_at = NULL,
           rejection_reason = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${updPlaceholders}) AND user_id = ? AND status = 'pending'`
    ).bind(...updatableIds, session.user.id).run()

    const updatedCount = (updateResult as any)?.meta?.changes ?? 0

    return {
      success: true,
      updatedCount,
      updatedIds: updatableIds,
      skippedIds,
      message: `Withdrew ${updatedCount} quote(s) to drafts`
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Bulk withdraw quotes error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to bulk withdraw quotes' })
  }
})
