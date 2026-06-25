import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }
    
    const collectionId = getRouterParam(event, 'id')
    const quoteId = getRouterParam(event, 'quoteId')
    
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throwServer(400, 'Invalid collection ID')
    }
    
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throwServer(400, 'Invalid quote ID')
    }
    
    // Check if collection exists and user owns it
    const collection = await db.select()
      .from(schema.userCollections)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .get()
    
    if (!collection) {
      throwServer(404, 'Collection not found')
    }
    
    if (collection.userId !== session.user.id) {
      throwServer(403, 'Access denied')
    }
    
    // Check if quote is in collection
    const collectionQuote = await db.select()
      .from(schema.collectionQuotes)
      .where(and(
        eq(schema.collectionQuotes.collectionId, parseInt(collectionId)),
        eq(schema.collectionQuotes.quoteId, parseInt(quoteId))
      ))
      .get()
    
    if (!collectionQuote) {
      throwServer(404, 'Quote not found in this collection')
    }
    
    // Remove quote from collection
    await db.delete(schema.collectionQuotes)
      .where(and(
        eq(schema.collectionQuotes.collectionId, parseInt(collectionId)),
        eq(schema.collectionQuotes.quoteId, parseInt(quoteId))
      ))
      .run()
    
    // Update collection's updated_at timestamp
    await db.update(schema.userCollections)
      .set({ updatedAt: new Date() })
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .run()
    
    return {
      success: true,
      message: 'Quote removed from collection successfully'
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Remove quote from collection error:', error)
    throwServer(500, 'Failed to remove quote from collection')
  }
})
