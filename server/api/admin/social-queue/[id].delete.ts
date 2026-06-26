import { db, schema } from 'hub:db'
import { and, eq, gt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid queue id')
  }

  const existing = await db
    .select({
      id: schema.socialQueue.id,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      platform: schema.socialQueue.platform,
      status: schema.socialQueue.status,
      position: schema.socialQueue.position
    })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)
    .get()

  if (!existing) throwServer(404, 'Queue item not found')

  await db.delete(schema.socialQueue).where(eq(schema.socialQueue.id, id))

  if (existing!.status === 'queued') {
    await db.update(schema.socialQueue)
      .set({
        position: sql`${schema.socialQueue.position} - 1`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(and(
        eq(schema.socialQueue.platform, existing!.platform),
        eq(schema.socialQueue.status, 'queued'),
        gt(schema.socialQueue.position, existing!.position)
      ))
  }

  return {
    success: true,
    data: {
      deleted: true,
      id: existing!.id,
      sourceType: existing!.sourceType,
      sourceId: existing!.sourceId
    }
  }
})
