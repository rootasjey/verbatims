import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const body = await readBody(event)
  const quoteIds = Array.isArray(body?.quoteIds)
    ? body.quoteIds.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0)
    : []

  if (!quoteIds.length) {
    throwServer(400, 'quoteIds is required')
  }

  const platform = String(body?.platform || 'x')
  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const scheduledFor = body?.scheduledFor ? new Date(String(body.scheduledFor)) : null
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    throwServer(400, 'Invalid scheduledFor value')
  }

  const approvedQuotes = await db
    .select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(inArray(schema.quotes.id, quoteIds))

  const approvedIdSet = new Set(approvedQuotes.map(q => q.id))
  const validQuoteIds = quoteIds.filter((id: number) => approvedIdSet.has(id))

  if (!validQuoteIds.length) {
    throwServer(400, 'No valid quotes found')
  }

  const maxPositionRow = await db.select({
    maxPosition: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
  })
  .from(schema.socialQueue)
  .where(eq(schema.socialQueue.platform, platform as any))

  const basePosition = Number(maxPositionRow[0]?.maxPosition || 0)

  const values = validQuoteIds.map((quoteId: number, index: number) => ({
    quoteId,
    sourceType: 'quote',
    sourceId: quoteId,
    platform: platform as any,
    status: 'queued' as const,
    position: basePosition + index + 1,
    scheduledFor: scheduledFor || undefined,
    createdBy: user!.id
  }))

  const BATCH_SIZE = 10
  const inserted: Array<{
    id: number
    quoteId: number
    sourceType: string
    sourceId: number
    position: number
    status: string
  }> = []

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE)
    const result = await db.insert(schema.socialQueue).values(batch).returning({
      id: schema.socialQueue.id,
      quoteId: schema.socialQueue.quoteId,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      position: schema.socialQueue.position,
      status: schema.socialQueue.status
    })
    inserted.push(...result)
  }

  return {
    success: true,
    data: inserted,
    count: inserted.length
  }
})
