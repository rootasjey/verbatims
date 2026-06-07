import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const id = Number(body?.id)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Queue item id is required' })
  }

  const item = await db.select({ id: schema.socialQueue.id, status: schema.socialQueue.status })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)

  if (!item.length) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  if (item[0].status !== 'failed') {
    throw createError({ statusCode: 400, statusMessage: 'Only failed items can be re-queued' })
  }

  await db.update(schema.socialQueue)
    .set({ status: 'queued', updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.socialQueue.id, id))

  return { success: true, data: { requeued: true, id } }
})
