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
    
    // Check if quote exists and is approved
    const quote = await db.prepare(`
      SELECT id FROM quotes WHERE id = ? AND status = 'approved'
    `).bind(body.quote_id).first()
    
    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
    }
    
    // Check if quote is already in collection
    const existingEntry = await db.prepare(`
      SELECT * FROM collection_quotes 
      WHERE collection_id = ? AND quote_id = ?
    `).bind(collectionId, body.quote_id).first()
    
    if (existingEntry) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Quote is already in this collection'
      })
    }
    
    // Add quote to collection
    await db.prepare(`
      INSERT INTO collection_quotes (collection_id, quote_id)
      VALUES (?, ?)
    `).bind(collectionId, body.quote_id).run()
    
    // Update collection's updated_at timestamp
    await db.prepare(`
      UPDATE user_collections 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(collectionId).run()
    
    // Get the added quote with full details
    const addedQuote = await db.prepare(`
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
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE q.id = ?
      GROUP BY q.id
    `).bind(body.quote_id).first()
    
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
