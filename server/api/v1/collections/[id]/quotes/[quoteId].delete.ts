import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Remove a quote from a collection',
    description: 'Removes a quote from a collection. User must own the collection.',
    tags: ['Collections'],
    security: [{ apiKey: ['write:collections'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
      { name: 'quoteId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Quote ID' },
    ],
    responses: {
      '200': { description: 'Quote removed from collection' },
      '403': { description: 'Access denied' },
      '404': { description: 'Collection or quote not found in collection' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:collections')

  const collectionId = parseInt(getRouterParam(event, 'id') || '')
  const quoteId = parseInt(getRouterParam(event, 'quoteId') || '')

  if (isNaN(collectionId)) throwServer(400, 'Invalid collection ID')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const collection = await db.select()
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .get()

  if (!collection) throwServer(404, 'Collection not found')
  if (collection.userId !== api.userId) throwServer(403, 'Access denied')

  const entry = await db.select()
    .from(schema.collectionQuotes)
    .where(and(
      eq(schema.collectionQuotes.collectionId, collectionId),
      eq(schema.collectionQuotes.quoteId, quoteId)
    ))
    .get()

  if (!entry) throwServer(404, 'Quote not found in this collection')

  await db.delete(schema.collectionQuotes)
    .where(and(
      eq(schema.collectionQuotes.collectionId, collectionId),
      eq(schema.collectionQuotes.quoteId, quoteId)
    ))
    .run()

  await db.update(schema.userCollections)
    .set({ updatedAt: new Date() })
    .where(eq(schema.userCollections.id, collectionId))
    .run()

  return {
    success: true,
    message: 'Quote removed from collection successfully',
  }
})
