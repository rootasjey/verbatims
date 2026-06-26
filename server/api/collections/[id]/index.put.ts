import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const { user } = await requireAuth(event)
    
    const collectionId = getRouterParam(event, 'id')
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throwServer(400, 'Invalid collection ID')
    }
    
    const body = await readBody(event)
    
    // Check if collection exists and user owns it
    const collection = await db.select()
      .from(schema.userCollections)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .get()
    
    if (!collection) {
      throwServer(404, 'Collection not found')
    }
    
    // Check ownership or admin privileges
    const canEdit = collection.userId === user.id ||
                   user.role === 'admin' ||
                   user.role === 'moderator'
    
    if (!canEdit) {
      throwServer(403, 'Access denied')
    }
    
    // Validate input
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string') {
        throwServer(400, 'Collection name is required')
      }
      
      if (body.name.length < 2 || body.name.length > 100) {
        throwServer(400, 'Collection name must be between 2 and 100 characters')
      }
      
      // Check if user already has another collection with this name
      const existingCollection = await db.select()
        .from(schema.userCollections)
        .where(and(
          eq(schema.userCollections.userId, collection.userId),
          eq(schema.userCollections.name, body.name.trim())
        ))
        .get()
      
      if (existingCollection && existingCollection.id !== parseInt(collectionId)) {
        throwServer(409, 'You already have a collection with this name')
      }
    }
    
    if (body.description !== undefined && body.description && body.description.length > 500) {
      throwServer(400, 'Description must be less than 500 characters')
    }
    
    // Build update object
    const updateData: any = {}
    
    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    
    if (body.is_public !== undefined) {
      updateData.isPublic = !!body.is_public
    }
    
    if (Object.keys(updateData).length === 0) {
      throwServer(400, 'No valid fields to update')
    }
    
    updateData.updatedAt = new Date()
    
    // Update collection
    await db.update(schema.userCollections)
      .set(updateData)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .run()
    
    // Fetch updated collection with user info
    const updatedCollection = await db.get(sql`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        COUNT(cq.quote_id) as quotes_count
      FROM ${schema.userCollections} c
      LEFT JOIN ${schema.users} u ON c.user_id = u.id
      LEFT JOIN ${schema.collectionQuotes} cq ON c.id = cq.collection_id
      WHERE c.id = ${parseInt(collectionId)}
      GROUP BY c.id
    `)
    
    return {
      success: true,
      data: updatedCollection,
      message: 'Collection updated successfully'
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Collection update error:', error)
    throwServer(500, 'Failed to update collection')
  }
})
