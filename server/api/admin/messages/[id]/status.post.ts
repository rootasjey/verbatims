import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) { throw createError({ statusCode: 400, statusMessage: 'Invalid id' }) }

  const body = await readBody<{ status: ReportStatus }>(event)
  const status = body?.status
  if (!status || !['new', 'triaged', 'spam', 'resolved'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  const existing = await db
    .select({ id: schema.userMessages.id })
    .from(schema.userMessages)
    .where(eq(schema.userMessages.id, id))
    .limit(1)
  if (!existing.length) { throw createError({ statusCode: 404, statusMessage: 'Message not found' }) }

  await db.update(schema.userMessages)
    .set({
      status,
      reviewedBy: session.user.id,
      reviewedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.userMessages.id, id))

  return { ok: true }
})
