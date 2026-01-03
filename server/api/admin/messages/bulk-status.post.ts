import { db, schema } from 'hub:db'
import { inArray, sql } from 'drizzle-orm'
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

  await db.update(schema.userMessages)
    .set({
      status,
      reviewedBy: session.user.id,
      reviewedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(inArray(schema.userMessages.id, ids))

  return { ok: true, updated: ids.length }
})
