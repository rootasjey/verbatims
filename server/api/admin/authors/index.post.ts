/**
 * Admin API: Create Author
 * Creates a new author with admin authentication
 */

import type { CreateAuthorData } from '~/types/author'

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

    const body = await readBody(event) as CreateAuthorData
    const db = hubDatabase()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Author name is required'
      })
    }

    // Check if author with same name already exists
    const existingAuthor = await db.prepare(`
      SELECT id FROM authors WHERE LOWER(name) = LOWER(?)
    `).bind(body.name.trim()).first()

    if (existingAuthor) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An author with this name already exists'
      })
    }

    // Prepare author data
    const authorData = {
      name: body.name.trim(),
      is_fictional: body.is_fictional || false,
      birth_date: body.birth_date || null,
      birth_location: body.birth_location || null,
      death_date: body.death_date || null,
      death_location: body.death_location || null,
      job: body.job || null,
      description: body.description || null,
      image_url: body.image_url || null,
      socials: JSON.stringify(body.socials || {}),
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert author
    const result = await db.prepare(`
      INSERT INTO authors (
        name, is_fictional, birth_date, birth_location, death_date, death_location,
        job, description, image_url, socials, views_count, likes_count, shares_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      authorData.name,
      authorData.is_fictional,
      authorData.birth_date,
      authorData.birth_location,
      authorData.death_date,
      authorData.death_location,
      authorData.job,
      authorData.description,
      authorData.image_url,
      authorData.socials,
      authorData.views_count,
      authorData.likes_count,
      authorData.shares_count,
      authorData.created_at,
      authorData.updated_at
    ).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create author'
      })
    }

    // Fetch the created author
    const createdAuthor = await db.prepare(`
      SELECT * FROM authors WHERE id = ?
    `).bind(result.meta.last_row_id).first()

    return {
      success: true,
      data: createdAuthor
    }

  } catch (error: any) {
    console.error('Error creating author:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
