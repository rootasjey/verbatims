import { db, schema } from 'hub:db'
import { sql, eq, and, inArray } from 'drizzle-orm'
import { logActivity } from '~~/server/utils/activity-log'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const body = await readBody(event)

    // Accept either a single id or an array of ids
    let ids: number[] = []
    if (Array.isArray(body?.ids)) {
      ids = body.ids.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n))
    } else if (body?.id != null) {
      const n = Number(body.id)
      if (Number.isInteger(n)) ids = [n]
    }

    // Validate payload
    ids = Array.from(new Set(ids))
    if (ids.length === 0) {
      throwServer(400, 'At least one valid quote id is required')
    }
    if (ids.length > 200) {
      throwServer(400, 'You can unpublish at most 200 quotes at a time')
    }

    // Filter to only currently approved quotes to avoid unnecessary writes
    const rows = []
    for (const idBatch of chunkForD1Bindings(ids, 1, 1)) {
      rows.push(...await db.select({ id: schema.quotes.id, name: schema.quotes.name })
        .from(schema.quotes)
        .where(and(
          inArray(schema.quotes.id, idBatch),
          eq(schema.quotes.status, 'approved')
        ))
        .all())
    }

    const updatableIds = rows.map(r => r.id)
    const skippedIds = ids.filter(id => !updatableIds.includes(id))

    if (updatableIds.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        updatedIds: [],
        skippedIds,
        message: 'No approved quotes to unpublish'
      }
    }

    let updatedCount = 0
    for (const idBatch of chunkForD1Bindings(updatableIds, 1, 1)) {
      const updateResult = await db.update(schema.quotes)
        .set({
          status: 'draft',
          moderatorId: null,
          moderatedAt: null,
          rejectionReason: null,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(and(
          inArray(schema.quotes.id, idBatch),
          eq(schema.quotes.status, 'approved')
        ))
        .run()
      updatedCount += Number((updateResult as any)?.changes ?? 0)
    }

    for (const id of updatableIds) {
      const quoteName = rows.find(r => r.id === id)?.name || ''
      await logActivity(event, { type: 'quote_unpublished', userId: user.id, targetId: id, targetType: 'quote', metadata: { status: 'draft', bulk: updatableIds.length > 1, name: quoteName } })
    }

    return {
      success: true,
      updatedCount,
      updatedIds: updatableIds,
      skippedIds,
      message: `Unpublished ${updatedCount} quote(s)`
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin unpublish quotes error:', error)
    throwServer(500, 'Failed to unpublish quotes')
  }
})
