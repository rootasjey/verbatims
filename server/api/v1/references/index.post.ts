import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { createReferenceSchema } from '../../../validation/schemas'

defineRouteMeta({
  openAPI: {
    summary: 'Create a reference',
    description: 'Creates a new reference. Requires moderator or admin role.',
    tags: ['References'],
    security: [{ apiKey: ['write:references'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'primary_type'],
            properties: {
              name: { type: 'string' },
              primary_type: { type: 'string', description: 'Type of reference (e.g. film, book, game)' },
              secondary_type: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              release_date: { type: 'string', nullable: true },
              original_language: { type: 'string', nullable: true },
              image_url: { type: 'string', nullable: true },
              urls: { type: 'object', additionalProperties: true, nullable: true, description: 'External URLs' },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Reference created' },
      '403': { description: 'Insufficient role' },
      '409': { description: 'Reference with this name already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:references')
  requireApiKeyRole(api, 'admin', 'moderator')

  const body = await readValidatedBody(event, createReferenceSchema.parse)

  const existingReference = await db.select()
    .from(schema.quoteReferences)
    .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`)
    .get()

  if (existingReference) throwServer(409, 'A reference with this name already exists')

  const result = await db.insert(schema.quoteReferences)
    .values({
      name: body.name,
      originalLanguage: body.original_language || 'en',
      releaseDate: body.release_date ?? null,
      description: body.description ?? null,
      primaryType: body.primary_type as any,
      secondaryType: body.secondary_type ?? null,
      imageUrl: body.image_url ?? null,
      urls: JSON.stringify(body.urls || {}),
      viewsCount: 0,
      likesCount: 0,
      sharesCount: 0,
    } as any)
    .returning()
    .get()

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      type: result.primaryType,
      secondary_type: result.secondaryType,
      image_url: result.imageUrl,
      release_date: result.releaseDate,
      language: result.originalLanguage,
      description: result.description,
      urls: result.urls ? JSON.parse(result.urls) : [],
      stats: { views: result.viewsCount, likes: result.likesCount, shares: result.sharesCount },
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    },
    message: 'Reference created successfully',
  }
})
