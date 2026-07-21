import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import { updateAuthorSchema } from '../../../validation/schemas'

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
  if (body.birth_date !== undefined) updateData.birthDate = body.birth_date
  if (body.birth_location !== undefined) updateData.birthLocation = body.birth_location
  if (body.death_date !== undefined) updateData.deathDate = body.death_date
  if (body.death_location !== undefined) updateData.deathLocation = body.death_location
  if (body.job !== undefined) updateData.job = body.job
  if (body.description !== undefined) updateData.description = body.description
  if (body.image_url !== undefined) updateData.imageUrl = body.image_url
  if (body.socials !== undefined) updateData.socials = JSON.stringify(body.socials)

  if (Object.keys(updateData).length === 1) {
    throwServer(400, 'No fields to update')
  }

  const updated = await db.update(schema.authors)
    .set(updateData)
    .where(eq(schema.authors.id, authorId))
    .returning()
    .get()

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
