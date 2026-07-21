import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { updateCollectionSchema } from '../../../../validation/schemas'

defineRouteMeta({
  openAPI: {
    summary: 'Update a collection',
    description: 'Updates a collection. User must own the collection.',
    tags: ['Collections'],
    security: [{ apiKey: ['write:collections'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              is_public: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Collection updated' },
      '400': { description: 'No valid fields to update' },
      '403': { description: 'Access denied' },
      '404': { description: 'Collection not found' },
      '409': { description: 'Collection name already exists for this user' },
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

  const body = await readValidatedBody(event, updateCollectionSchema.parse)

  const updateData: Record<string, any> = {}
  if (body.name !== undefined) {
    const existingName = await db.select()
      .from(schema.userCollections)
      .where(and(
        eq(schema.userCollections.userId, api.userId),
        eq(schema.userCollections.name, body.name.trim())
      ))
      .get()

    if (existingName && existingName.id !== collectionId) {
      throwServer(409, 'You already have a collection with this name')
    }
    updateData.name = body.name.trim()
  }
  if (body.description !== undefined) updateData.description = body.description || null
  if (body.is_public !== undefined) updateData.isPublic = body.is_public

  if (Object.keys(updateData).length === 0) {
    throwServer(400, 'No valid fields to update')
  }

  updateData.updatedAt = new Date()

  await db.update(schema.userCollections)
    .set(updateData)
    .where(eq(schema.userCollections.id, collectionId))
    .run()

  const updated = await db.select()
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .get()

  return {
    success: true,
    data: {
      id: updated!.id,
      name: updated!.name,
      description: updated!.description,
      is_public: updated!.isPublic,
      created_at: updated!.createdAt,
      updated_at: updated!.updatedAt,
    },
    message: 'Collection updated successfully',
  }
})
