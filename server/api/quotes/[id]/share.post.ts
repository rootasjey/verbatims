export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const db = hubDatabase()

    // Check if quote exists and is approved
    const quote = await db.prepare(`
      SELECT id, shares_count FROM quotes WHERE id = ? AND status = 'approved'
    `).bind(quoteId).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
    }

    // Increment share count
    await db.prepare(`
      UPDATE quotes SET shares_count = shares_count + 1 WHERE id = ?
    `).bind(quoteId).run()

    // Get updated share count
    const updatedQuote = await db.prepare(`
      SELECT shares_count FROM quotes WHERE id = ?
    `).bind(quoteId).first()

    return {
      success: true,
      data: {
        sharesCount: updatedQuote.shares_count
      }
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error tracking share:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track share'
    })
  }
})
