import type { Quote, CreatedQuoteResult } from "~/types"export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const db = hubDatabase()

    // Check if quote exists, is a draft, and belongs to the user
    const quote: Quote | null = await db.prepare(`
      SELECT * FROM quotes 
      WHERE id = ? AND status = 'draft' AND user_id = ?
    `).bind(quoteId, session.user.id).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found, not a draft, or you do not have permission to submit it'
      })
    }

    // Validate quote has minimum required content
    if (!quote.name || quote.name.trim().length < 10) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote must have at least 10 characters before submission'
      })
    }

    // Update quote status to pending
    await db.prepare(`
      UPDATE quotes 
      SET 
        status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(quoteId).run()

    // Fetch the updated quote with all related data
    const updatedQuote: CreatedQuoteResult | null = await db.prepare(`
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
    `).bind(quoteId).first()

    if (!updatedQuote) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch updated quote'
      })
    }

    // Process tags
    const processedQuote = {
      ...updatedQuote,
      tags: updatedQuote.tag_names ? updatedQuote.tag_names.split(',').map((name, index) => ({
        name,
        color: updatedQuote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }

    return {
      success: true,
      data: processedQuote,
      message: 'Quote submitted successfully and is now pending moderation'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Quote submission error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit quote'
    })
  }
})
