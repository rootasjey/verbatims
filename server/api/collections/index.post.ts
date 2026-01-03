import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const body = await readBody(event)

    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Collection name is required'
      })
    }
    
    if (body.name.length < 2 || body.name.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Collection name must be between 2 and 100 characters'
      })
    }
    
    if (body.description && body.description.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Description must be less than 500 characters'
      })
    }
    
    // Check if user already has a collection with this name
    const existingCollection = await db.select()
      .from(schema.userCollections)
      .where(and(
        eq(schema.userCollections.userId, session.user.id),
        eq(schema.userCollections.name, body.name.trim())
      ))
      .get()
    
    if (existingCollection) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You already have a collection with this name'
      })
    }
    
    // Create collection
    const result = await db.insert(schema.userCollections)
      .values({
        userId: session.user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        isPublic: !!body.is_public
      })
      .returning()
      .get()
    
    // Fetch the created collection with user info
    const collection = await db.get(sql`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        0 as quotes_count
      FROM ${schema.userCollections} c
      LEFT JOIN ${schema.users} u ON c.user_id = u.id
      WHERE c.id = ${result.id}
    `)
    
    return {
      success: true,
      data: collection,
      message: 'Collection created successfully'
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Collection creation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create collection'
    })
  }
})
