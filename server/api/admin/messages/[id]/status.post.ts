import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    throwServer(403, 'Admin access required')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) { throwServer(400, 'Invalid id') }

  const body = await readBody<{ status: ReportStatus }>(event)
  const status = body?.status
  if (!status || !['new', 'triaged', 'spam', 'resolved'].includes(status)) {
    throwServer(400, 'Invalid status')
  }

  const existing = await db
    .select({ id: schema.userMessages.id })
    .from(schema.userMessages)
    .where(eq(schema.userMessages.id, id))
    .limit(1)
  if (!existing.length) { throwServer(404, 'Message not found') }

  await db.update(schema.userMessages)
    .set({
      status,
      reviewedBy: session.user.id,
      reviewedAt: new Date()
    })
    .where(eq(schema.userMessages.id, id))

  return { ok: true }
})
