import { db, schema } from 'hub:db'
import { and, eq, gt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid queue id' })
  }

  const existing = await db
    .select({
      id: schema.socialQueue.id,
      platform: schema.socialQueue.platform,
      status: schema.socialQueue.status,
      position: schema.socialQueue.position
    })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)
    .get()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  await db.delete(schema.socialQueue).where(eq(schema.socialQueue.id, id))

  if (existing.status === 'queued') {
    await db.update(schema.socialQueue)
      .set({
        position: sql`${schema.socialQueue.position} - 1`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(and(
        eq(schema.socialQueue.platform, existing.platform),
        eq(schema.socialQueue.status, 'queued'),
        gt(schema.socialQueue.position, existing.position)
      ))
  }

  return {
    success: true,
    data: { deleted: true }
  }
})
