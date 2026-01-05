import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'

/**
 * Admin API: Update Reference
 * Updates an existing reference with admin authentication
 */
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

    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const body = await readBody(event) as UpdateQuoteReferenceData

    // Check if reference exists
    const existingReference = await db.select()
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(referenceId)))
      .get()

    if (!existingReference) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Validate required fields
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reference name is required'
      })
    }

    // Validate primary type if provided
    if (body.primary_type !== undefined) {
      const validTypes = ['film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other']
      if (!validTypes.includes(body.primary_type)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid primary type'
        })
      }
    }

    // Check if another reference with same name already exists (excluding current reference)
    if (body.name && body.name.trim() !== existingReference.name) {
      const duplicateReference = await db.select()
        .from(schema.quoteReferences)
        .where(and(
          sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`,
          sql`${schema.quoteReferences.id} != ${parseInt(referenceId)}`
        ))
        .get()

      if (duplicateReference) {
        throw createError({
          statusCode: 409,
          statusMessage: 'A reference with this name already exists'
        })
      }
    }

    // Build update object
    const updateData: any = { updatedAt: sql`CURRENT_TIMESTAMP` }

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.original_language !== undefined) updateData.originalLanguage = body.original_language
    if (body.release_date !== undefined) updateData.releaseDate = body.release_date
    if (body.description !== undefined) updateData.description = body.description
    if (body.primary_type !== undefined) updateData.primaryType = body.primary_type
    if (body.secondary_type !== undefined) updateData.secondaryType = body.secondary_type
    if (body.image_url !== undefined) updateData.imageUrl = body.image_url
    if (body.urls !== undefined) updateData.urls = JSON.stringify(body.urls)

    if (Object.keys(updateData).length === 1) { // Only updatedAt was added
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Update reference
    const updatedReference = await db.update(schema.quoteReferences)
      .set(updateData)
      .where(eq(schema.quoteReferences.id, parseInt(referenceId)))
      .returning()
      .get()

    return {
      success: true,
      data: updatedReference
    }

  } catch (error: any) {
    console.error('Error updating reference:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
