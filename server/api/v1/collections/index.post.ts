import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { createCollectionSchema } from '../../../validation/schemas'

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
