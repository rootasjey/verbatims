import { db, schema } from 'hub:db'
import { and, eq, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const platform = String(body?.platform || '').trim()
  if (!isSocialPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: SOCIAL_PLATFORM_ERROR_MESSAGE })
  }

  const failedCondition = and(
    eq(schema.socialQueue.platform, platform as any),
    eq(schema.socialQueue.status, 'failed')
  )

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(failedCondition)

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .update(schema.socialQueue)
      .set({
        status: 'queued',
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(failedCondition)
  }

  return {
    success: true,
    data: {
      requeued: true,
      platform,
      requeuedCount: total
    }
  }
})
