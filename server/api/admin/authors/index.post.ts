import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

/**
 * Admin API: Create Author
 * Creates a new author with admin authentication
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

    const body = await readBody(event) as CreateAuthorData

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Author name is required'
      })
    }

    // Check if author with same name already exists
    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`)
      .get()

    if (existingAuthor) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An author with this name already exists'
      })
    }

    // Insert author
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
        imageUrl: body.image_url || null,
        socials: JSON.stringify(body.socials || {}),
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
    console.error('Error creating author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
