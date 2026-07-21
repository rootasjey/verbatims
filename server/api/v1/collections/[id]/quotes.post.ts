import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Add a quote to a collection',
    description: 'Adds an approved quote to a collection. User must own the collection.',
    tags: ['Collections'],
    security: [{ apiKey: ['write:collections'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['quote_id'],
            properties: {
              quote_id: { type: 'integer', description: 'ID of the approved quote to add' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Quote added to collection' },
      '403': { description: 'Access denied' },
      '404': { description: 'Collection or quote not found' },
      '409': { description: 'Quote already in collection' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:collections')

  const collectionId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(collectionId)) throwServer(400, 'Invalid collection ID')

  const body = await readBody(event)
  const quoteId = parseInt(body?.quote_id)
  if (!quoteId || isNaN(quoteId)) throwServer(400, 'Valid quote_id is required')

  const collection = await db.select()
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .get()

  if (!collection) throwServer(404, 'Collection not found')
  if (collection.userId !== api.userId) throwServer(403, 'Access denied')

  const quote = await db.select()
    .from(schema.quotes)
    .where(and(
      eq(schema.quotes.id, quoteId),
      eq(schema.quotes.status, 'approved')
    ))
    .get()

  if (!quote) throwServer(404, 'Quote not found or not approved')

  const existingEntry = await db.select()
    .from(schema.collectionQuotes)
    .where(and(
      eq(schema.collectionQuotes.collectionId, collectionId),
      eq(schema.collectionQuotes.quoteId, quoteId)
    ))
    .get()

  if (existingEntry) throwServer(409, 'Quote is already in this collection')

  await db.insert(schema.collectionQuotes)
    .values({ collectionId, quoteId })
    .run()

  await db.update(schema.userCollections)
    .set({ updatedAt: new Date() })
    .where(eq(schema.userCollections.id, collectionId))
    .run()

  return {
    success: true,
    message: 'Quote added to collection successfully',
  }
})
