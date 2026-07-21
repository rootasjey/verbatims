import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import { updateReferenceSchema } from '../../../validation/schemas'

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:references')
  requireApiKeyRole(api, 'admin', 'moderator')

  const refId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(refId)) throwServer(400, 'Invalid reference ID')

  const body = await readValidatedBody(event, updateReferenceSchema.parse)

  const existing = await db.select()
    .from(schema.quoteReferences)
    .where(eq(schema.quoteReferences.id, refId))
    .get()

  if (!existing) throwServer(404, 'Reference not found')

  if (body.name && body.name !== existing.name) {
    const duplicate = await db.select()
      .from(schema.quoteReferences)
      .where(and(
        sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`,
        sql`${schema.quoteReferences.id} != ${refId}`
      ))
      .get()
    if (duplicate) throwServer(409, 'A reference with this name already exists')
  }

  const updateData: Record<string, any> = { updatedAt: sql`CURRENT_TIMESTAMP` }
  if (body.name !== undefined) updateData.name = body.name
  if (body.original_language !== undefined) updateData.originalLanguage = body.original_language
  if (body.release_date !== undefined) updateData.releaseDate = body.release_date
  if (body.description !== undefined) updateData.description = body.description
  if (body.primary_type !== undefined) updateData.primaryType = body.primary_type
  if (body.secondary_type !== undefined) updateData.secondaryType = body.secondary_type
  if (body.image_url !== undefined) updateData.imageUrl = body.image_url
  if (body.urls !== undefined) updateData.urls = JSON.stringify(body.urls)

  if (Object.keys(updateData).length === 1) {
    throwServer(400, 'No fields to update')
  }

  const updated = await db.update(schema.quoteReferences)
    .set(updateData)
    .where(eq(schema.quoteReferences.id, refId))
    .returning()
    .get()

  return {
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      type: updated.primaryType,
      secondary_type: updated.secondaryType,
      image_url: updated.imageUrl,
      release_date: updated.releaseDate,
      language: updated.originalLanguage,
      description: updated.description,
      urls: updated.urls ? JSON.parse(updated.urls) : [],
      stats: { views: updated.viewsCount, likes: updated.likesCount, shares: updated.sharesCount },
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    },
    message: 'Reference updated successfully',
  }
})
