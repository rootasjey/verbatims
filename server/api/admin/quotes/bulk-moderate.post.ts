export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin privileges
    const session = await requireUserSession(event)
    if (!session || !session.user) {
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
    
    const body = await readBody(event)
    
    // Validate input
    if (!body.quote_ids || !Array.isArray(body.quote_ids) || body.quote_ids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote IDs array is required'
      })
    }
    
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
        statusMessage: 'Rejection reason is required when rejecting quotes'
      })
    }
    
    // Limit bulk operations
    if (body.quote_ids.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot moderate more than 50 quotes at once'
      })
    }
    
    const db = hubDatabase()
    
    // Validate all quote IDs are numbers and quotes exist
    const quoteIds: number[] = body.quote_ids.map((id: string) => {
      const numId = parseInt(id)
      if (isNaN(numId)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'All quote IDs must be valid numbers'
        })
      }
      return numId
    })
    
    // Check if all quotes exist and are pending
    const placeholders = quoteIds.map(() => '?').join(',')
    const quotesResult = await db.prepare(`
      SELECT id FROM quotes
      WHERE id IN (${placeholders}) AND status = 'pending'
    `).bind(...quoteIds).all()

    const existingQuotes = quotesResult?.results || []

    if (existingQuotes.length !== quoteIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Some quotes not found or not pending moderation'
      })
    }
    
    // Perform bulk update
    const newStatus = body.action === 'approve' ? 'approved' : 'rejected'
    
    const updatePromises = quoteIds.map(quoteId => 
      db.prepare(`
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
    )
    
    await Promise.all(updatePromises)
    
    return {
      success: true,
      data: {
        processed_count: quoteIds.length,
        action: body.action,
        quote_ids: quoteIds
      },
      message: `${quoteIds.length} quotes ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Bulk quote moderation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to perform bulk moderation'
    })
  }
})
