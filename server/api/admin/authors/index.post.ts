import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

/**
 * Admin API: Create Author
 * Creates a new author with admin authentication
 */
export default defineEventHandler(async (event) => {
  try {
    // Check admin authentication
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throwServer(403, 'Admin or moderator access required')
    }

    const body = await readBody(event) as CreateAuthorData

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      throwServer(400, 'Author name is required')
    }

    // Check if author with same name already exists
    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`)
      .get()

    if (existingAuthor) {
      throwServer(409, 'An author with this name already exists')
    }

    // Insert author (without image URL — we'll upload to R2 first)
    const result = await db.insert(schema.authors)
      .values({
        name: body.name.trim(),
        isFictional: body.is_fictional || false,
        birthDate: body.birth_date || null,
        birthLocation: body.birth_location || null,
        deathDate: body.death_date || null,
        deathLocation: body.death_location || null,
        job: body.job || null,
        description: body.description || null,
        imageUrl: null,
        socials: JSON.stringify(body.socials || {}),
        viewsCount: 0,
        likesCount: 0,
        sharesCount: 0
      })
      .returning()
      .get()

    let finalImageUrl: string | null = null
    if (body.image_url) {
      finalImageUrl = await uploadAndStoreImage(body.image_url, 'authors', result.id)
    }

    if (finalImageUrl) {
      const updated = await db.update(schema.authors)
        .set({ imageUrl: finalImageUrl })
        .where(eq(schema.authors.id, result.id))
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
    console.error('Error creating author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
