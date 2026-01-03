/**
 * Admin API: Update Author
 * Updates an existing author with admin authentication
 */

import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import type { UpdateAuthorData } from '~/types/author'

export default defineEventHandler(async (event) => {
  try {
    // Check admin authentication
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const body = await readBody(event) as UpdateAuthorData

    // Check if author exists
    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()

    if (!existingAuthor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Validate required fields
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Author name is required'
      })
    }

    // Check if another author with same name already exists (excluding current author)
    if (body.name && body.name.trim() !== existingAuthor.name) {
      const duplicateAuthor = await db.select()
        .from(schema.authors)
        .where(and(
          sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`,
          sql`${schema.authors.id} != ${parseInt(authorId)}`
        ))
        .get()

      if (duplicateAuthor) {
        throw createError({
          statusCode: 409,
          statusMessage: 'An author with this name already exists'
        })
      }
    }

    // Build update object
    const updateData: any = { updatedAt: sql`CURRENT_TIMESTAMP` }

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.is_fictional !== undefined) updateData.isFictional = body.is_fictional
    if (body.birth_date !== undefined) updateData.birthDate = body.birth_date
    if (body.birth_location !== undefined) updateData.birthLocation = body.birth_location
    if (body.death_date !== undefined) updateData.deathDate = body.death_date
    if (body.death_location !== undefined) updateData.deathLocation = body.death_location
    if (body.job !== undefined) updateData.job = body.job
    if (body.description !== undefined) updateData.description = body.description
    if (body.image_url !== undefined) updateData.imageUrl = body.image_url
    if (body.socials !== undefined) updateData.socials = JSON.stringify(body.socials)

    if (Object.keys(updateData).length === 1) { // Only updatedAt was added
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Update author
    const updatedAuthor = await db.update(schema.authors)
      .set(updateData)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .returning()
      .get()

    return {
      success: true,
      data: updatedAuthor
    }

  } catch (error: any) {
    console.error('Error updating author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
