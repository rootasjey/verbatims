import type { ReportStatus } from '~/types/report'

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

  const db = hubDatabase()
  const existing = await db.prepare('SELECT id FROM user_messages WHERE id = ?').bind(id).first()
  if (!existing) { throw createError({ statusCode: 404, statusMessage: 'Message not found' }) }

  await db.prepare(`
    UPDATE user_messages
    SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, session.user.id, id).run()

  return { ok: true }
})
