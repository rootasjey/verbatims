import { db, schema } from 'hub:db'
import { and, eq, or, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

function buildFinishedCondition(platform: string) {
  return and(
    eq(schema.socialQueue.platform, platform as any),
    or(
      eq(schema.socialQueue.status, 'posted'),
      eq(schema.socialQueue.status, 'failed')
    )
  )
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const body = await readBody(event)
  const platform = String(body?.platform || '').trim()
  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const confirm = body?.confirm
  if (!confirm) {
    throwServer(400, 'Confirmation required to clear finished items')
  }

  const finishedCondition = buildFinishedCondition(platform)
  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(finishedCondition)

  const sourceBreakdown = await db
    .select({
      sourceType: schema.socialQueue.sourceType,
      total: sql<number>`COUNT(*)`
    })
    .from(schema.socialQueue)
    .where(finishedCondition)
    .groupBy(schema.socialQueue.sourceType)

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .delete(schema.socialQueue)
      .where(finishedCondition)
  }

  return {
    success: true,
    data: {
      deleted: true,
      platform,
      deletedCount: total,
      sourceTypes: sourceBreakdown.map(entry => ({
        sourceType: entry.sourceType,
        count: Number(entry.total || 0)
      }))
    }
  }
})
