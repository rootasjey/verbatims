import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { addQuoteLikes } from '../../services/like.service'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody<{ quoteIds?: unknown }>(event)
  const rawIds = body?.quoteIds

  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 100 || !rawIds.every(id => Number.isInteger(id) && Number(id) > 0)) {
    throwServer(400, 'Provide between 1 and 100 valid quote IDs')
  }

  const quoteIds = [...new Set(rawIds as number[])]
  const publishedQuoteIds = new Set<number>()
  for (const quoteIdBatch of chunkForD1Bindings(quoteIds, 1, 1)) {
    const publishedQuotes = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        inArray(schema.quotes.id, quoteIdBatch),
        eq(schema.quotes.status, 'approved')
      ))
      .all()
    for (const quote of publishedQuotes) publishedQuoteIds.add(quote.id)
  }

  if (publishedQuoteIds.size !== quoteIds.length) {
    throwServer(404, 'One or more quotes were not found or are not published')
  }

  const addedIds = await addQuoteLikes(quoteIds, user.id)
  return { success: true, data: { likedIds: quoteIds, addedIds } }
})
