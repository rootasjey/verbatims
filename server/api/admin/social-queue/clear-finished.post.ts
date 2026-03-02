import { db, schema } from 'hub:db'
import { and, eq, or, sql } from 'drizzle-orm'
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

  const confirm = body?.confirm
  if (!confirm) {
    throw createError({ statusCode: 400, statusMessage: 'Confirmation required to clear finished items' })
  }

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(and(
      eq(schema.socialQueue.platform, platform as any),
      or(
        eq(schema.socialQueue.status, 'posted'),
        eq(schema.socialQueue.status, 'failed')
      )
    ))

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .delete(schema.socialQueue)
      .where(and(
        eq(schema.socialQueue.platform, platform as any),
        or(
          eq(schema.socialQueue.status, 'posted'),
          eq(schema.socialQueue.status, 'failed')
        )
      ))
  }

  return {
    success: true,
    deletedCount: total
  }
})
