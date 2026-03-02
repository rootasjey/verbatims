import { db, schema } from 'hub:db'
import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const id = Number(body?.id)
  const direction = String(body?.direction || '') as 'up' | 'down'

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid queue id' })
  }

  if (!['up', 'down'].includes(direction)) {
    throw createError({ statusCode: 400, statusMessage: 'direction must be up or down' })
  }

  const current = await db
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

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  if (current.status !== 'queued') {
    throw createError({ statusCode: 400, statusMessage: 'Only queued items can be reordered' })
  }

  const adjacent = direction === 'up'
    ? await db
      .select({ id: schema.socialQueue.id, position: schema.socialQueue.position })
      .from(schema.socialQueue)
      .where(and(
        eq(schema.socialQueue.platform, current.platform),
        eq(schema.socialQueue.status, 'queued'),
        lt(schema.socialQueue.position, current.position)
      ))
      .orderBy(desc(schema.socialQueue.position))
      .limit(1)
      .get()
    : await db
      .select({ id: schema.socialQueue.id, position: schema.socialQueue.position })
      .from(schema.socialQueue)
      .where(and(
        eq(schema.socialQueue.platform, current.platform),
        eq(schema.socialQueue.status, 'queued'),
        gt(schema.socialQueue.position, current.position)
      ))
      .orderBy(asc(schema.socialQueue.position))
      .limit(1)
      .get()

  if (!adjacent) {
    return { success: true, data: { moved: false } }
  }

  await db.update(schema.socialQueue)
    .set({
      position: adjacent.position,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.socialQueue.id, current.id))

  await db.update(schema.socialQueue)
    .set({
      position: current.position,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.socialQueue.id, adjacent.id))

  return {
    success: true,
    data: {
      moved: true,
      id: current.id,
      position: adjacent.position
    }
  }
})
