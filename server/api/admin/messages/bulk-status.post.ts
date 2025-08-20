import type { ReportStatus } from '~/types/report'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<{ ids: number[]; status: ReportStatus }>(event)
  const ids = (body?.ids || []).filter(n => typeof n === 'number')
  const status = body?.status
  if (!ids.length || !status || !['new', 'triaged', 'spam', 'resolved'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const db = hubDatabase()
  await db.prepare(
    `UPDATE user_messages
     SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id IN (${ids.map(() => '?').join(',')})`
  ).bind(status, session.user.id, ...ids).run()

  return { ok: true, updated: ids.length }
})
