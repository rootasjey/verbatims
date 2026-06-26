import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import { createCollectionSchema } from '../../validation/schemas'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    const body = await readValidatedBody(event, createCollectionSchema.parse)
    
    // Check if user already has a collection with this name
    const existingCollection = await db.select()
      .from(schema.userCollections)
      .where(and(
        eq(schema.userCollections.userId, user.id),
        eq(schema.userCollections.name, body.name.trim())
      ))
      .get()
    
    if (existingCollection) {
      throwServer(409, 'You already have a collection with this name')
    }
    
    // Create collection
    const result = await db.insert(schema.userCollections)
      .values({
        userId: user.id,
        name: body.name,
        description: body.description || null,
        isPublic: body.is_public
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
    throwServer(500, 'Failed to create collection')
  }
})
