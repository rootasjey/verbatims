import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const collectionId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ quoteIds?: unknown }>(event)
  const rawIds = body?.quoteIds

  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    throwServer(400, 'Invalid collection ID')
  }
  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 100 || !rawIds.every(id => Number.isInteger(id) && Number(id) > 0)) {
    throwServer(400, 'Provide between 1 and 100 valid quote IDs')
  }

  const quoteIds = [...new Set(rawIds as number[])]
  const collection = await db.select({ id: schema.userCollections.id, userId: schema.userCollections.userId })
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .get()

  if (!collection) throwServer(404, 'Collection not found')
  if (collection.userId !== user.id) throwServer(403, 'Access denied')

  const quoteIdBatches = chunkForD1Bindings(quoteIds, 1, 1)
  const existingQuoteIds = new Set<number>()
  for (const quoteIdBatch of quoteIdBatches) {
    const existingQuotes = await db.select({ quoteId: schema.collectionQuotes.quoteId })
      .from(schema.collectionQuotes)
      .where(and(
        eq(schema.collectionQuotes.collectionId, collectionId),
        inArray(schema.collectionQuotes.quoteId, quoteIdBatch)
      ))
      .all()
    for (const quote of existingQuotes) {
      if (quote.quoteId !== null) existingQuoteIds.add(quote.quoteId)
    }
  }

  if (existingQuoteIds.size !== quoteIds.length) {
    throwServer(404, 'One or more quotes were not found in this collection')
  }

  await db.batch([
    ...quoteIdBatches.map(quoteIdBatch => db.delete(schema.collectionQuotes)
      .where(and(
        eq(schema.collectionQuotes.collectionId, collectionId),
        inArray(schema.collectionQuotes.quoteId, quoteIdBatch)
      ))),
    db.update(schema.userCollections)
      .set({ updatedAt: new Date() })
      .where(eq(schema.userCollections.id, collectionId))
  ] as any)

  return { success: true, data: { removedIds: quoteIds } }
})
