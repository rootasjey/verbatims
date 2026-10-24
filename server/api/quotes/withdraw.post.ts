import { db, schema } from 'hub:db'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

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
      throwServer(400, 'At least one valid quote id is required')
    }
    if (ids.length > 200) {
      throwServer(400, 'You can withdraw at most 200 quotes at a time')
    }

    // Only allow withdrawing quotes owned by the user and currently pending
    const updatableIdSet = new Set<number>()
    for (const idBatch of chunkForD1Bindings(ids, 1, 2)) {
      const existing = await db.select({ id: schema.quotes.id })
        .from(schema.quotes)
        .where(and(
          inArray(schema.quotes.id, idBatch),
          eq(schema.quotes.userId, user.id),
          eq(schema.quotes.status, 'pending')
        ))
        .all()
      for (const row of existing) updatableIdSet.add(row.id)
    }

    const updatableIds = [...updatableIdSet]
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

    let updatedCount = 0
    for (const idBatch of chunkForD1Bindings(updatableIds, 1, 2)) {
      const updateResult = await db.update(schema.quotes)
        .set({
          status: 'draft',
          moderatorId: null,
          moderatedAt: null,
          rejectionReason: null,
          updatedAt: new Date()
        })
        .where(and(
          inArray(schema.quotes.id, idBatch),
          eq(schema.quotes.userId, user.id),
          eq(schema.quotes.status, 'pending')
        ))
        .run()
      updatedCount += Number(updateResult.rowsAffected ?? 0)
    }

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
    throwServer(500, 'Failed to bulk withdraw quotes')
  }
})
