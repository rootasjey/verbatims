import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
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

  // ensure client acknowledged the danger
  const confirm = body?.confirm
  if (!confirm) {
    throw createError({ statusCode: 400, statusMessage: 'Confirmation required to clear queue' })
  }

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform as any))

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .delete(schema.socialQueue)
      .where(eq(schema.socialQueue.platform, platform as any))
  }

  return {
    success: true,
    deletedCount: total
  }
})
