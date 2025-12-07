/**
 * Admin API: Update Author
 * Updates an existing author with admin authentication
 */

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
    const db = hubDatabase()

    // Check if author exists
    const existingAuthor = await db.prepare(`
      SELECT * FROM authors WHERE id = ?
    `).bind(authorId).first()

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
      const duplicateAuthor = await db.prepare(`
        SELECT id FROM authors WHERE LOWER(name) = LOWER(?) AND id != ?
      `).bind(body.name.trim(), authorId).first()

      if (duplicateAuthor) {
        throw createError({
          statusCode: 409,
          statusMessage: 'An author with this name already exists'
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
    if (body.is_fictional !== undefined) {
      updateFields.push('is_fictional = ?')
      updateValues.push(body.is_fictional)
    }
    if (body.birth_date !== undefined) {
      updateFields.push('birth_date = ?')
      updateValues.push(body.birth_date)
    }
    if (body.birth_location !== undefined) {
      updateFields.push('birth_location = ?')
      updateValues.push(body.birth_location)
    }
    if (body.death_date !== undefined) {
      updateFields.push('death_date = ?')
      updateValues.push(body.death_date)
    }
    if (body.death_location !== undefined) {
      updateFields.push('death_location = ?')
      updateValues.push(body.death_location)
    }
    if (body.job !== undefined) {
      updateFields.push('job = ?')
      updateValues.push(body.job)
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(body.description)
    }
    if (body.image_url !== undefined) {
      updateFields.push('image_url = ?')
      updateValues.push(body.image_url)
    }
    if (body.socials !== undefined) {
      updateFields.push('socials = ?')
      updateValues.push(JSON.stringify(body.socials))
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

    // Add author ID for WHERE clause
    updateValues.push(authorId)

    // Update author
    const result = await db.prepare(`
      UPDATE authors SET ${updateFields.join(', ')} WHERE id = ?
    `).bind(...updateValues).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update author'
      })
    }

    // Fetch the updated author
    const updatedAuthor = await db.prepare(`
      SELECT * FROM authors WHERE id = ?
    `).bind(authorId).first()

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
