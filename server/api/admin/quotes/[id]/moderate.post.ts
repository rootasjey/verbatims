import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import type { CreatedQuoteResult } from '~~/server/types'
import { autoTagQuoteById } from '~~/server/utils/tagging'

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
    
    // Check if quote exists and is pending
    const quote = await db.select()
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(quoteId)),
        eq(schema.quotes.status, 'pending')
      ))
      .get()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not pending moderation'
      })
    }
    
    // Update quote status
    const newStatus = body.action === 'approve' ? 'approved' : 'rejected'
    
    await db.update(schema.quotes)
      .set({
        status: newStatus,
        moderatorId: session.user.id,
        moderatedAt: sql`CURRENT_TIMESTAMP`,
        rejectionReason: body.action === 'reject' ? body.rejection_reason.trim() : null,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.quotes.id, parseInt(quoteId)))
      .run()

    let autoTagResult: { matchedTagNames: string[], attachedCount: number } | null = null
    if (body.action === 'approve') {
      autoTagResult = await autoTagQuoteById(
        quote.id,
        quote.name,
        quote.language || undefined
      )
    }
    
    // Get updated quote with full details
    const updatedQuote = await db.get<CreatedQuoteResult>(sql.raw(`
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
      WHERE q.id = ${parseInt(quoteId)}
      GROUP BY q.id
    `))

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
      autoTagging: autoTagResult,
      message: `Quote ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Quote moderation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to moderate quote'
    })
  }
})
