/**
 * Admin API: Create Reference
 * Creates a new reference with admin authentication
 */

import type { CreateQuoteReferenceData } from '~/types/quote-reference'

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

    const body = await readBody(event) as CreateQuoteReferenceData
    const db = hubDatabase()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reference name is required'
      })
    }

    if (!body.primary_type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Primary type is required'
      })
    }

    // Validate primary type
    const validTypes = ['film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other']
    if (!validTypes.includes(body.primary_type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid primary type'
      })
    }

    // Check if reference with same name already exists
    const existingReference = await db.prepare(`
      SELECT id FROM quote_references WHERE LOWER(name) = LOWER(?)
    `).bind(body.name.trim()).first()

    if (existingReference) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A reference with this name already exists'
      })
    }

    // Prepare reference data
    const referenceData = {
      name: body.name.trim(),
      original_language: body.original_language || 'en',
      release_date: body.release_date || null,
      description: body.description || null,
      primary_type: body.primary_type,
      secondary_type: body.secondary_type || null,
      image_url: body.image_url || null,
      urls: JSON.stringify(body.urls || {}),
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert reference
    const result = await db.prepare(`
      INSERT INTO quote_references (
        name, original_language, release_date, description, primary_type, secondary_type,
        image_url, urls, views_count, likes_count, shares_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      referenceData.name,
      referenceData.original_language,
      referenceData.release_date,
      referenceData.description,
      referenceData.primary_type,
      referenceData.secondary_type,
      referenceData.image_url,
      referenceData.urls,
      referenceData.views_count,
      referenceData.likes_count,
      referenceData.shares_count,
      referenceData.created_at,
      referenceData.updated_at
    ).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create reference'
      })
    }

    // Fetch the created reference
    const createdReference = await db.prepare(`
      SELECT * FROM quote_references WHERE id = ?
    `).bind(result.meta.last_row_id).first()

    return {
      success: true,
      data: createdReference
    }

  } catch (error: any) {
    console.error('Error creating reference:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
