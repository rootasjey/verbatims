import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const body = await readBody(event)
  const id = Number(body?.id)

  if (!id) {
    throwServer(400, 'Queue item id is required')
  }

  const item = await db.select({ id: schema.socialQueue.id, status: schema.socialQueue.status })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)

  if (!item.length) {
    throwServer(404, 'Queue item not found')
  }

  if (item[0].status !== 'failed') {
    throwServer(400, 'Only failed items can be re-queued')
  }

  await db.update(schema.socialQueue)
    .set({ status: 'queued', updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.socialQueue.id, id))

  return { success: true, data: { requeued: true, id } }
})
