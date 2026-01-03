import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

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
    
    if (collection.userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
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
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found in this collection'
      })
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
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove quote from collection'
    })
  }
})
