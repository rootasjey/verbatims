import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { createCollectionSchema } from '../../../validation/schemas'

defineRouteMeta({
  openAPI: {
    summary: 'Create a collection',
    description: 'Creates a new quote collection for the authenticated user.',
    tags: ['Collections'],
    security: [{ apiKey: ['write:collections'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              is_public: { type: 'boolean', default: true },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Collection created' },
      '409': { description: 'Collection name already exists for this user' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:collections')

  const body = await readValidatedBody(event, createCollectionSchema.parse)

  const existing = await db.select()
    .from(schema.userCollections)
    .where(and(
      eq(schema.userCollections.userId, api.userId),
      eq(schema.userCollections.name, body.name.trim())
    ))
    .get()

  if (existing) throwServer(409, 'You already have a collection with this name')

  const result = await db.insert(schema.userCollections)
    .values({
      userId: api.userId,
      name: body.name,
      description: body.description || null,
      isPublic: body.is_public,
    })
    .returning()
    .get()

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      description: result.description,
      is_public: result.isPublic,
      quotes_count: 0,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    },
    message: 'Collection created successfully',
  }
})
