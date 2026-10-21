import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import { updateAuthorSchema } from '../../../validation/schemas'
import { authorLifeDateColumnsFromInput } from '~~/server/utils/author-life-date'
import { logActivity } from '~~/server/utils/activity-log'

defineRouteMeta({
  openAPI: {
    summary: 'Update an author',
    description: 'Updates an existing author. Requires moderator or admin role.',
    tags: ['Authors'],
    security: [{ apiKey: ['write:authors'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              is_fictional: { type: 'boolean' },
              job: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              birth_date: { type: 'string', nullable: true },
              birth_year: { type: 'integer', nullable: true },
              birth_era: { type: 'string', enum: ['bce', 'ce'] },
              birth_month: { type: 'integer', nullable: true },
              birth_day: { type: 'integer', nullable: true },
              birth_is_approximate: { type: 'boolean' },
              birth_calendar: { type: 'string' },
              birth_location: { type: 'string', nullable: true },
              death_date: { type: 'string', nullable: true },
              death_year: { type: 'integer', nullable: true },
              death_era: { type: 'string', enum: ['bce', 'ce'] },
              death_month: { type: 'integer', nullable: true },
              death_day: { type: 'integer', nullable: true },
              death_is_approximate: { type: 'boolean' },
              death_calendar: { type: 'string' },
              death_location: { type: 'string', nullable: true },
              image_url: { type: 'string', nullable: true },
              socials: { type: 'object', additionalProperties: { type: 'string' }, nullable: true },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Author updated' },
      '403': { description: 'Insufficient role' },
      '404': { description: 'Author not found' },
      '409': { description: 'Name conflict' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:authors')
  requireApiKeyRole(api, 'admin', 'moderator')

  const authorId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(authorId)) throwServer(400, 'Invalid author ID')

  const body = await readValidatedBody(event, updateAuthorSchema.parse)

  const existingAuthor = await db.select()
    .from(schema.authors)
    .where(eq(schema.authors.id, authorId))
    .get()

  if (!existingAuthor) throwServer(404, 'Author not found')

  if (body.name && body.name !== existingAuthor.name) {
    const duplicate = await db.select()
      .from(schema.authors)
      .where(and(
        sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`,
        sql`${schema.authors.id} != ${authorId}`
      ))
      .get()
    if (duplicate) throwServer(409, 'An author with this name already exists')
  }

  const updateData: Record<string, any> = { updatedAt: sql`CURRENT_TIMESTAMP` }
  if (body.name !== undefined) updateData.name = body.name
  if (body.is_fictional !== undefined) updateData.isFictional = body.is_fictional
  Object.assign(updateData, authorLifeDateColumnsFromInput('birth', body as Record<string, unknown>, existingAuthor as unknown as Record<string, unknown>))
  if (body.birth_location !== undefined) updateData.birthLocation = body.birth_location
  Object.assign(updateData, authorLifeDateColumnsFromInput('death', body as Record<string, unknown>, existingAuthor as unknown as Record<string, unknown>))
  if (body.death_location !== undefined) updateData.deathLocation = body.death_location
  if (body.job !== undefined) updateData.job = body.job
  if (body.description !== undefined) updateData.description = body.description
  if (body.socials !== undefined) updateData.socials = JSON.stringify(body.socials)

  if (body.image_url !== undefined) {
    const oldUrl = existingAuthor.imageUrl
    const newUrl = body.image_url

    if (newUrl !== oldUrl) {
      if (isR2ImageUrl(oldUrl)) {
        await deleteImageByUrl(oldUrl!)
      }

      if (newUrl) {
        const storedUrl = await uploadAndStoreImage(newUrl, 'authors', authorId)
        updateData.imageUrl = storedUrl || newUrl
      } else {
        updateData.imageUrl = null
      }
    }
  }

  if (Object.keys(updateData).length === 1) {
    throwServer(400, 'No fields to update')
  }

  const updated = await db.update(schema.authors)
    .set(updateData)
    .where(eq(schema.authors.id, authorId))
    .returning()
    .get()

  await logActivity(event, { type: 'author_edited', userId: api.userId, targetId: authorId, targetType: 'author', metadata: { name: updated.name } })

  return {
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      fictional: updated.isFictional,
      image_url: updated.imageUrl,
      job: updated.job,
      dates: {
        birth: updated.birthDate,
        death: updated.deathDate,
        birth_year: updated.birthYear,
        birth_era: updated.birthEra,
        birth_month: updated.birthMonth,
        birth_day: updated.birthDay,
        birth_is_approximate: updated.birthIsApproximate,
        birth_calendar: updated.birthCalendar,
        death_year: updated.deathYear,
        death_era: updated.deathEra,
        death_month: updated.deathMonth,
        death_day: updated.deathDay,
        death_is_approximate: updated.deathIsApproximate,
        death_calendar: updated.deathCalendar,
        birth_location: updated.birthLocation,
        death_location: updated.deathLocation,
      },
      description: updated.description,
      stats: { views: updated.viewsCount, likes: updated.likesCount, shares: updated.sharesCount },
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    },
    message: 'Author updated successfully',
  }
})
