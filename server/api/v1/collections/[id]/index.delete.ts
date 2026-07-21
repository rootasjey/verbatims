import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Delete a collection',
    description: 'Deletes a collection. User must own the collection.',
    tags: ['Collections'],
    security: [{ apiKey: ['write:collections'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
    ],
    responses: {
      '200': { description: 'Collection deleted' },
      '403': { description: 'Access denied' },
      '404': { description: 'Collection not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:collections')

  const collectionId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(collectionId)) throwServer(400, 'Invalid collection ID')

  const collection = await db.select()
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .get()

  if (!collection) throwServer(404, 'Collection not found')
  if (collection.userId !== api.userId) throwServer(403, 'Access denied')

  await db.delete(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .run()

  return { success: true, message: 'Collection deleted successfully' }
})
