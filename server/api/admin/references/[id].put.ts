/**
 * Admin API: Update Reference
 * Updates an existing reference with admin authentication
 */

import type { UpdateQuoteReferenceData } from '~/types/quote-reference'

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
    const db = hubDatabase()

    // Check if reference exists
    const existingReference = await db.prepare(`
      SELECT * FROM quote_references WHERE id = ?
    `).bind(referenceId).first()

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
      const duplicateReference = await db.prepare(`
        SELECT id FROM quote_references WHERE LOWER(name) = LOWER(?) AND id != ?
      `).bind(body.name.trim(), referenceId).first()

      if (duplicateReference) {
        throw createError({
          statusCode: 409,
          statusMessage: 'A reference with this name already exists'
        })
      }
    }

    // Build update fields
    const updateFields = []
    const updateValues = []

    if (body.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(body.name.trim())
    }
    if (body.original_language !== undefined) {
      updateFields.push('original_language = ?')
      updateValues.push(body.original_language)
    }
    if (body.release_date !== undefined) {
      updateFields.push('release_date = ?')
      updateValues.push(body.release_date)
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(body.description)
    }
    if (body.primary_type !== undefined) {
      updateFields.push('primary_type = ?')
      updateValues.push(body.primary_type)
    }
    if (body.secondary_type !== undefined) {
      updateFields.push('secondary_type = ?')
      updateValues.push(body.secondary_type)
    }
    if (body.image_url !== undefined) {
      updateFields.push('image_url = ?')
      updateValues.push(body.image_url)
    }
    if (body.urls !== undefined) {
      updateFields.push('urls = ?')
      updateValues.push(JSON.stringify(body.urls))
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())

    if (updateFields.length === 1) { // Only updated_at was added
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Add reference ID for WHERE clause
    updateValues.push(referenceId)

    // Update reference
    const result = await db.prepare(`
      UPDATE quote_references SET ${updateFields.join(', ')} WHERE id = ?
    `).bind(...updateValues).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update reference'
      })
    }

    // Fetch the updated reference
    const updatedReference = await db.prepare(`
      SELECT * FROM quote_references WHERE id = ?
    `).bind(referenceId).first()

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
