import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

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
    
    if (!body.quote_id || isNaN(parseInt(body.quote_id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid quote ID is required'
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
    
    // Check if quote exists and is approved
    const quote = await db.select()
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(body.quote_id)),
        eq(schema.quotes.status, 'approved')
      ))
      .get()
    
    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
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
      throw createError({
        statusCode: 409,
        statusMessage: 'Quote is already in this collection'
      })
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
    
    // Get the added quote with full details
    const addedQuote = await db.get(sql`
      SELECT 
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM ${schema.quotes} q
      LEFT JOIN ${schema.authors} a ON q.author_id = a.id
      LEFT JOIN ${schema.quoteReferences} r ON q.reference_id = r.id
      LEFT JOIN ${schema.users} u ON q.user_id = u.id
      LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
      LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
      WHERE q.id = ${parseInt(body.quote_id)}
      GROUP BY q.id
    `)
    
    // Ensure we have an added quote result
    if (!addedQuote) {
      throw createError({ statusCode: 404, statusMessage: 'Failed to load added quote' })
    }

    // Process tags safely (DB result shapes can be loose)
    const tagNames = (addedQuote as any).tag_names ?? ''
    const tagColors = (addedQuote as any).tag_colors ?? ''
    const parsedTags = tagNames
      ? tagNames.split(',').map((name: string, index: number) => ({
          name,
          color: tagColors.split(',')[index] || 'gray'
        }))
      : []

    const processedQuote = {
      ...(addedQuote as any),
      tags: parsedTags
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
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add quote to collection'
    })
  }
})
