import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const { user } = await requireAuth(event)
    
    const collectionId = getRouterParam(event, 'id')
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throwServer(400, 'Invalid collection ID')
    }
    
    const body = await readBody(event)
    
    if (!body.quote_id || isNaN(parseInt(body.quote_id))) {
      throwServer(400, 'Valid quote ID is required')
    }
    
    // Check if collection exists and user owns it
    const collection = await db.select()
      .from(schema.userCollections)
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .get()
    
    if (!collection) {
      throwServer(404, 'Collection not found')
    }
    
    if (collection.userId !== user.id) {
      throwServer(403, 'Access denied')
    }
    
    // Check if quote exists and is approved
    const quote = await db.select()
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(body.quote_id)),
        eq(schema.quotes.status, 'approved')
      ))
      .get()
    
    if (!quote) {
      throwServer(404, 'Quote not found or not approved')
    }
    
    // Check if quote is already in collection
    const existingEntry = await db.select()
      .from(schema.collectionQuotes)
      .where(and(
        eq(schema.collectionQuotes.collectionId, parseInt(collectionId)),
        eq(schema.collectionQuotes.quoteId, parseInt(body.quote_id))
      ))
      .get()
    
    if (existingEntry) {
      throwServer(409, 'Quote is already in this collection')
    }
    
    // Add quote to collection
    await db.insert(schema.collectionQuotes)
      .values({
        collectionId: parseInt(collectionId),
        quoteId: parseInt(body.quote_id)
      })
      .run()
    
    // Update collection's updated_at timestamp
    await db.update(schema.userCollections)
      .set({ updatedAt: new Date() })
      .where(eq(schema.userCollections.id, parseInt(collectionId)))
      .run()
    
    const addedQuote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      status: schema.quotes.status,
      userId: schema.quotes.userId,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      user_name: schema.users.name,
    })
      .from(schema.quotes)
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .where(eq(schema.quotes.id, Number(body.quote_id)))
      .get()
    
    // Ensure we have an added quote result
    if (!addedQuote) {
      throwServer(404, 'Failed to load added quote')
    }

    const [tags, provenance] = await Promise.all([
      db.select({ name: schema.tags.name, color: schema.tags.color })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(eq(schema.quoteTags.quoteId, addedQuote.id))
        .all(),
      getQuoteProvenance(addedQuote.id),
    ])
    const attribution = provenance.attributions.find(item => item.is_primary) ?? provenance.attributions[0]

    const processedQuote = {
      ...addedQuote,
      author: attribution?.author_id ? attribution.author : null,
      reference: attribution?.reference_id ? attribution.reference : null,
      attributions: provenance.attributions,
      sources: provenance.sources,
      tags,
    }
    
    return {
      success: true,
      data: processedQuote,
      message: 'Quote added to collection successfully'
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Add quote to collection error:', error)
    throwServer(500, 'Failed to add quote to collection')
  }
})
