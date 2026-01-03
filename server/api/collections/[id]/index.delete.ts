import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

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
    
    // Check if collection exists and user owns it
    const collection = await db.select()
      .from(schema.userCollections)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .get()
    
    if (!collection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found'
      })
    }
    
    // Check ownership or admin privileges
    const canDelete = collection.userId === session.user.id ||
                     session.user.role === 'admin' ||
                     session.user.role === 'moderator'
    
    if (!canDelete) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }
    
    // Delete collection (cascade will handle collection_quotes)
    await db.delete(schema.userCollections)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .run()
    
    return {
      success: true,
      message: 'Collection deleted successfully'
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Collection deletion error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete collection'
    })
  }
})
