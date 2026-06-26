import { db, schema } from 'hub:db'
import { sql, eq, and, inArray } from 'drizzle-orm'
import { autoTagQuoteById } from '~~/server/utils/tagging'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)
    
    const body = await readBody(event)
    
    // Validate input
    if (!body.quote_ids || !Array.isArray(body.quote_ids) || body.quote_ids.length === 0) {
      throwServer(400, 'Quote IDs array is required')
    }
    
    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      throwServer(400, 'Valid action (approve/reject) is required')
    }
    
    // Validate rejection reason if rejecting
    if (body.action === 'reject' && (!body.rejection_reason || body.rejection_reason.trim().length === 0)) {
      throwServer(400, 'Rejection reason is required when rejecting quotes')
    }
    
    // Limit bulk operations
    if (body.quote_ids.length > 50) {
      throwServer(400, 'Cannot moderate more than 50 quotes at once')
    }
    
    // Validate all quote IDs are numbers and quotes exist
    const quoteIds: number[] = body.quote_ids.map((id: string) => {
      const numId = parseInt(id)
      if (isNaN(numId)) {
        throwServer(400, 'All quote IDs must be valid numbers')
      }
      return numId
    })
    
    // Check if all quotes exist and are pending
    const existingQuotes = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language
    })
      .from(schema.quotes)
      .where(and(
        inArray(schema.quotes.id, quoteIds),
        eq(schema.quotes.status, 'pending')
      ))
      .all()

    if (existingQuotes.length !== quoteIds.length) {
      throwServer(400, 'Some quotes not found or not pending moderation')
    }
    
    // Perform bulk update
    const newStatus = body.action === 'approve' ? 'approved' : 'rejected'
    
    await Promise.all(quoteIds.map(quoteId => 
      db.update(schema.quotes)
        .set({
          status: newStatus,
          moderatorId: user.id,
          moderatedAt: sql`CURRENT_TIMESTAMP`,
          rejectionReason: body.action === 'reject' ? body.rejection_reason.trim() : null,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(schema.quotes.id, quoteId))
        .run()
    ))

    let autoTaggedQuotes = 0
    if (body.action === 'approve') {
      const taggingResults = await Promise.all(existingQuotes.map(quote =>
        autoTagQuoteById(quote.id, quote.name, quote.language || undefined)
      ))

      autoTaggedQuotes = taggingResults.filter(result => result.attachedCount > 0).length
    }
    
    return {
      success: true,
      data: {
        processed_count: quoteIds.length,
        action: body.action,
        quote_ids: quoteIds,
        auto_tagged_quotes: autoTaggedQuotes
      },
      message: `${quoteIds.length} quotes ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Bulk quote moderation error:', error)
    throwServer(500, 'Failed to perform bulk moderation')
  }
})
