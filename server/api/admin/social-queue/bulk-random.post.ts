import { db, schema } from 'hub:db'
import { and, eq, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const requestedCount = Number(body?.count || 5)
    const count = Math.min(Math.max(Number.isInteger(requestedCount) ? requestedCount : 5, 1), 100)
    const platform = String(body?.platform || 'x')
    const language = String(body?.language || '').trim()

    if (!isSocialPlatform(platform)) {
      throw createError({ statusCode: 400, statusMessage: SOCIAL_PLATFORM_ERROR_MESSAGE })
    }

    const filters = [eq(schema.quotes.status, 'approved')]
    if (language) {
      filters.push(eq(schema.quotes.language, language as any))
    }

    const randomQuotes = await db
      .select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(...filters))
      .orderBy(sql`RANDOM()`)
      .limit(count)

    if (!randomQuotes.length) {
      return {
        success: true,
        data: [],
        count: 0
      }
    }

    const maxPositionRow = await db.select({
      maxPosition: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
    })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform as any))

    const basePosition = Number(maxPositionRow[0]?.maxPosition || 0)

    const values = randomQuotes.map((quote, index) => ({
      quoteId: quote.id,
      sourceType: 'quote',
      sourceId: quote.id,
      platform: platform as any,
      status: 'queued' as const,
      position: basePosition + index + 1,
      createdBy: session.user!.id
    }))

    const BATCH_SIZE = 10
    const inserted: Array<{
      id: number
      quoteId: number
      sourceType: string
      sourceId: number
      position: number
    }> = []

    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE)
      const result = await db.insert(schema.socialQueue).values(batch).returning({
        id: schema.socialQueue.id,
        quoteId: schema.socialQueue.quoteId,
        sourceType: schema.socialQueue.sourceType,
        sourceId: schema.socialQueue.sourceId,
        position: schema.socialQueue.position
      })
      inserted.push(...result)
    }

    return {
      success: true,
      data: inserted,
      count: inserted.length
    }
  }
  catch (err: any) {
    console.error('Error adding random quotes to social queue:', err)
    const originalMessage = err?.message || err?.statusMessage || ''
    const detail = err?.cause?.message || err?.data?.message || ''
    const combined = [originalMessage, detail].filter(Boolean).join(': ')
    throwServer(500, combined || 'Failed to add random quotes to social queue', {
      data: { originalError: err?.message || String(err) }
    })
  }
})
