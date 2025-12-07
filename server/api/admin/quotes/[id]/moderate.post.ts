import { CreatedQuoteResult } from "~/types"

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }
    
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }
    
    const body = await readBody(event)
    
    // Validate action
    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid action (approve/reject) is required'
      })
    }
    
    // Validate rejection reason if rejecting
    if (body.action === 'reject' && (!body.rejection_reason || body.rejection_reason.trim().length === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Rejection reason is required when rejecting a quote'
      })
    }
    
    const db = hubDatabase()
    
    // Check if quote exists and is pending
    const quote = await db.prepare(`
      SELECT * FROM quotes WHERE id = ? AND status = 'pending'
    `).bind(quoteId).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not pending moderation'
      })
    }
    
    // Update quote status
    const newStatus = body.action === 'approve' ? 'approved' : 'rejected'
    
    await db.prepare(`
      UPDATE quotes 
      SET 
        status = ?,
        moderator_id = ?,
        moderated_at = CURRENT_TIMESTAMP,
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      newStatus,
      session.user.id,
      body.action === 'reject' ? body.rejection_reason.trim() : null,
      quoteId
    ).run()
    
    // Get updated quote with full details
    const updatedQuote: CreatedQuoteResult | null = await db.prepare(`
      SELECT 
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        m.name as moderator_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN users m ON q.moderator_id = m.id
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
      message: `Quote ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Quote moderation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to moderate quote'
    })
  }
})
