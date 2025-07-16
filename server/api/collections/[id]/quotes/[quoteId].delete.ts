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
    const quoteId = getRouterParam(event, 'quoteId')
    
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid collection ID'
      })
    }
    
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }
    
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
    
    if (collection.user_id !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }
    
    // Check if quote is in collection
    const collectionQuote = await db.prepare(`
      SELECT * FROM collection_quotes 
      WHERE collection_id = ? AND quote_id = ?
    `).bind(collectionId, quoteId).first()
    
    if (!collectionQuote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found in this collection'
      })
    }
    
    // Remove quote from collection
    await db.prepare(`
      DELETE FROM collection_quotes 
      WHERE collection_id = ? AND quote_id = ?
    `).bind(collectionId, quoteId).run()
    
    // Update collection's updated_at timestamp
    await db.prepare(`
      UPDATE user_collections 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(collectionId).run()
    
    return {
      success: true,
      message: 'Quote removed from collection successfully'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Remove quote from collection error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove quote from collection'
    })
  }
})
