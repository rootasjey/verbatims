import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }
    
    const collectionId = getRouterParam(event, 'id')
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throwServer(400, 'Invalid collection ID')
    }
    
    // Check if collection exists and user owns it
    const collection = await db.select()
      .from(schema.userCollections)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .get()
    
    if (!collection) {
      throwServer(404, 'Collection not found')
    }
    
    // Check ownership or admin privileges
    const canDelete = collection.userId === session.user.id ||
                     session.user.role === 'admin' ||
                     session.user.role === 'moderator'
    
    if (!canDelete) {
      throwServer(403, 'Access denied')
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
    throwServer(500, 'Failed to delete collection')
  }
})
