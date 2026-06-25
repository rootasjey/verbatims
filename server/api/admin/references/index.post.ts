import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

/**
 * Admin API: Create Reference
 * Creates a new reference with admin authentication
 */
export default defineEventHandler(async (event) => {
  try {
    // Check admin authentication
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throwServer(403, 'Admin or moderator access required')
    }

    const body = await readBody(event) as CreateQuoteReferenceData

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      throwServer(400, 'Reference name is required')
    }

    if (!body.primary_type) {
      throwServer(400, 'Primary type is required')
    }

    // Validate primary type
    const validTypes = ['film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other']
    if (!validTypes.includes(body.primary_type)) {
      throwServer(400, 'Invalid primary type')
    }

    // Check if reference with same name already exists
    const existingReference = await db.select()
      .from(schema.quoteReferences)
      .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`)
      .get()

    if (existingReference) {
      throwServer(409, 'A reference with this name already exists')
    }

    // Insert reference (without image URL — we'll upload to R2 first)
    const result = await db.insert(schema.quoteReferences)
      .values({
        name: body.name.trim(),
        originalLanguage: body.original_language || 'en',
        releaseDate: body.release_date || null,
        description: body.description || null,
        primaryType: body.primary_type,
        secondaryType: body.secondary_type || null,
        imageUrl: null,
        urls: JSON.stringify(body.urls || {}),
        viewsCount: 0,
        likesCount: 0,
        sharesCount: 0
      })
      .returning()
      .get()

    let finalImageUrl: string | null = null
    if (body.image_url) {
      finalImageUrl = await uploadAndStoreImage(body.image_url, 'references', result.id)
    }

    if (finalImageUrl) {
      const updated = await db.update(schema.quoteReferences)
        .set({ imageUrl: finalImageUrl })
        .where(eq(schema.quoteReferences.id, result.id))
        .returning()
        .get()

      return {
        success: true,
        data: updated
      }
    }

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('Error creating reference:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
