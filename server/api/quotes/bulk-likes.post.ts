import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { addQuoteLikes } from '../../services/like.service'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody<{ quoteIds?: unknown }>(event)
  const rawIds = body?.quoteIds

  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 100 || !rawIds.every(id => Number.isInteger(id) && Number(id) > 0)) {
    throwServer(400, 'Provide between 1 and 100 valid quote IDs')
  }

  const quoteIds = [...new Set(rawIds as number[])]
  const publishedQuotes = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(and(
      inArray(schema.quotes.id, quoteIds),
      eq(schema.quotes.status, 'approved')
    ))
    .all()

  if (publishedQuotes.length !== quoteIds.length) {
    throwServer(404, 'One or more quotes were not found or are not published')
  }

  const addedIds = await addQuoteLikes(quoteIds, user.id)
  return { success: true, data: { likedIds: quoteIds, addedIds } }
})
