import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { createAuthorSchema } from '../../../validation/schemas'

defineRouteMeta({
  openAPI: {
    summary: 'Create an author',
    description: 'Creates a new author. Requires moderator or admin role.',
    tags: ['Authors'],
    security: [{ apiKey: ['write:authors'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              is_fictional: { type: 'boolean', default: false },
              job: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              birth_date: { type: 'string', nullable: true },
              birth_location: { type: 'string', nullable: true },
              death_date: { type: 'string', nullable: true },
              death_location: { type: 'string', nullable: true },
              image_url: { type: 'string', nullable: true, description: 'URL or /blob/ path' },
              socials: { type: 'object', additionalProperties: { type: 'string' }, nullable: true, description: 'Social media links' },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Author created' },
      '403': { description: 'Insufficient role (requires moderator or admin)' },
      '409': { description: 'Author with this name already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:authors')
  requireApiKeyRole(api, 'admin', 'moderator')

  const body = await readValidatedBody(event, createAuthorSchema.parse)

  const existingAuthor = await db.select()
    .from(schema.authors)
    .where(sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`)
    .get()

  if (existingAuthor) throwServer(409, 'An author with this name already exists')

  const result = await db.insert(schema.authors)
    .values({
      name: body.name,
      isFictional: body.is_fictional,
      birthDate: body.birth_date ?? null,
      birthLocation: body.birth_location ?? null,
      deathDate: body.death_date ?? null,
      deathLocation: body.death_location ?? null,
      job: body.job ?? null,
      description: body.description ?? null,
      imageUrl: body.image_url ?? null,
      socials: JSON.stringify(body.socials || {}),
      viewsCount: 0,
      likesCount: 0,
      sharesCount: 0,
    })
    .returning()
    .get()

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      fictional: result.isFictional,
      image_url: result.imageUrl,
      job: result.job,
      dates: {
        birth: result.birthDate,
        death: result.deathDate,
        birth_location: result.birthLocation,
        death_location: result.deathLocation,
      },
      description: result.description,
      stats: { views: result.viewsCount, likes: result.likesCount, shares: result.sharesCount },
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    },
    message: 'Author created successfully',
  }
})
