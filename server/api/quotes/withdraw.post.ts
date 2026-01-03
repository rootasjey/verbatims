import { db, schema } from 'hub:db'
import { eq, and, inArray, sql } from 'drizzle-orm'

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

    // Only allow withdrawing quotes owned by the user and currently pending
    const existing = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        inArray(schema.quotes.id, ids),
        eq(schema.quotes.userId, session.user.id),
        eq(schema.quotes.status, 'pending')
      ))
      .all()

    const updatableIds = existing.map(r => r.id)
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

    const updateResult = await db.update(schema.quotes)
      .set({
        status: 'draft',
        moderatorId: null,
        moderatedAt: null,
        rejectionReason: null,
        updatedAt: new Date()
      })
      .where(and(
        inArray(schema.quotes.id, updatableIds),
        eq(schema.quotes.userId, session.user.id),
        eq(schema.quotes.status, 'pending')
      ))
      .run()

    const updatedCount = Number(updateResult.rowsAffected ?? 0)

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
