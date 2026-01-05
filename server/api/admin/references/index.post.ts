import { db, schema } from 'hub:db'
import { sql, eq } from 'drizzle-orm'

/**
 * Admin API: Create Reference
 * Creates a new reference with admin authentication
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

    const body = await readBody(event) as CreateQuoteReferenceData

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
    const existingReference = await db.select()
      .from(schema.quoteReferences)
      .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`)
      .get()

    if (existingReference) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A reference with this name already exists'
      })
    }

    // Insert reference
    const result = await db.insert(schema.quoteReferences)
      .values({
        name: body.name.trim(),
        originalLanguage: body.original_language || 'en',
        releaseDate: body.release_date || null,
        description: body.description || null,
        primaryType: body.primary_type,
        secondaryType: body.secondary_type || null,
        imageUrl: body.image_url || null,
        urls: JSON.stringify(body.urls || {}),
        viewsCount: 0,
        likesCount: 0,
        sharesCount: 0
      })
      .returning()
      .get()

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('Error creating reference:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
