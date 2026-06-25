import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

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

  // ensure client acknowledged the danger
  const confirm = body?.confirm
  if (!confirm) {
    throwServer(400, 'Confirmation required to clear queue')
  }

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform as any))

  const sourceBreakdown = await db
    .select({
      sourceType: schema.socialQueue.sourceType,
      total: sql<number>`COUNT(*)`
    })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform as any))
    .groupBy(schema.socialQueue.sourceType)

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .delete(schema.socialQueue)
      .where(eq(schema.socialQueue.platform, platform as any))
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
