export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    const collectionId = getRouterParam(event, 'id')
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid collection ID'
      })
    }
    
    const body = await readBody(event)
    const db = hubDatabase()
    
    // Check if collection exists and user owns it
    const collection = await db.prepare(`
      SELECT * FROM user_collections WHERE id = ?
    `).bind(collectionId).first()
    
    if (!collection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found'
      })
    }
    
    // Check ownership or admin privileges
    const canEdit = collection.user_id === session.user.id ||
                   session.user.role === 'admin' ||
                   session.user.role === 'moderator'
    
    if (!canEdit) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }
    
    // Validate input
    if (body.name !== undefined) {
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
      
      // Check if user already has another collection with this name
      const existingCollection = await db.prepare(`
        SELECT id FROM user_collections 
        WHERE user_id = ? AND name = ? AND id != ?
      `).bind(collection.user_id, body.name.trim(), collectionId).first()
      
      if (existingCollection) {
        throw createError({
          statusCode: 409,
          statusMessage: 'You already have a collection with this name'
        })
      }
    }
    
    if (body.description !== undefined && body.description && body.description.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Description must be less than 500 characters'
      })
    }
    
    // Build update query
    const updates = []
    const bindings = []
    
    if (body.name !== undefined) {
      updates.push('name = ?')
      bindings.push(body.name.trim())
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?')
      bindings.push(body.description?.trim() || null)
    }
    
    if (body.is_public !== undefined) {
      updates.push('is_public = ?')
      bindings.push(!!body.is_public)
    }
    
    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    bindings.push(collectionId)
    
    // Update collection
    await db.prepare(`
      UPDATE user_collections 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run()
    
    // Fetch updated collection with user info
    const updatedCollection = await db.prepare(`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        COUNT(cq.quote_id) as quotes_count
      FROM user_collections c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN collection_quotes cq ON c.id = cq.collection_id
      WHERE c.id = ?
      GROUP BY c.id
    `).bind(collectionId).first()
    
    return {
      success: true,
      data: updatedCollection,
      message: 'Collection updated successfully'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Collection update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update collection'
    })
  }
})
