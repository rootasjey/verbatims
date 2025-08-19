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
    
    const db = hubDatabase()
    
    // Check if user already has a collection with this name
    const existingCollection = await db.prepare(`
      SELECT id FROM user_collections 
      WHERE user_id = ? AND name = ?
    `).bind(session.user.id, body.name.trim()).first()
    
    if (existingCollection) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You already have a collection with this name'
      })
    }
    
    // Create collection
    const result = await db.prepare(`
      INSERT INTO user_collections (user_id, name, description, is_public)
      VALUES (?, ?, ?, ?)
    `).bind(
      session.user.id,
      body.name.trim(),
      body.description?.trim() || null,
      !!body.is_public
    ).run()
    
    // Fetch the created collection with user info
    const collection = await db.prepare(`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        0 as quotes_count
      FROM user_collections c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first()
    
    return {
      success: true,
      data: collection,
      message: 'Collection created successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Collection creation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create collection'
    })
  }
})
