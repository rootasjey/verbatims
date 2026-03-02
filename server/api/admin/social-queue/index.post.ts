import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const quoteIds = Array.isArray(body?.quoteIds)
    ? body.quoteIds.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0)
    : []

  if (!quoteIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'quoteIds is required' })
  }

  const platform = String(body?.platform || 'x')
  if (!isSocialPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: SOCIAL_PLATFORM_ERROR_MESSAGE })
  }

  const scheduledFor = body?.scheduledFor ? new Date(String(body.scheduledFor)) : null
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid scheduledFor value' })
  }

  const approvedQuotes = await db
    .select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(inArray(schema.quotes.id, quoteIds))

  const approvedIdSet = new Set(approvedQuotes.map(q => q.id))
  const validQuoteIds = quoteIds.filter(id => approvedIdSet.has(id))

  if (!validQuoteIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'No valid quotes found' })
  }

  const maxPositionRow = await db.select({
    maxPosition: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
  })
  .from(schema.socialQueue)
  .where(eq(schema.socialQueue.platform, platform as any))

  const basePosition = Number(maxPositionRow[0]?.maxPosition || 0)

  const values = validQuoteIds.map((quoteId, index) => ({
    quoteId,
    platform: platform as any,
    status: 'queued' as const,
    position: basePosition + index + 1,
    scheduledFor: scheduledFor || undefined,
    createdBy: session.user!.id
  }))

  const inserted = await db.insert(schema.socialQueue).values(values).returning({
    id: schema.socialQueue.id,
    quoteId: schema.socialQueue.quoteId,
    position: schema.socialQueue.position,
    status: schema.socialQueue.status
  })

  return {
    success: true,
    data: inserted,
    count: inserted.length
  }
})
