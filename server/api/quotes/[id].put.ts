import type {
  ApiResponse,
  QuoteWithMetadata,
  CreatedQuoteResult
} from '~/types'
export default defineEventHandler(async (event): Promise<ApiResponse<QuoteWithMetadata>> => {
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

    const body = await readBody(event)
    const db = hubDatabase()

    // Validate required fields
    if (!body.name || body.name.length < 2 || body.name.length > 3000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote text must be between 2 and 3000 characters'
      })
    }

    // Check if quote exists and user has permission to edit it
    const existingQuote = await db.prepare(`
      SELECT * FROM quotes WHERE id = ?
    `).bind(quoteId).first()

    if (!existingQuote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found'
      })
    }

    // Check permissions: users can only edit their own drafts, admins can edit any quote
    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isOwner = existingQuote.user_id === session.user.id
    const isDraft = existingQuote.status === 'draft'

    if (!isAdmin && (!isOwner || !isDraft)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only edit your own draft quotes'
      })
    }

    let authorId = body.author_id
    let referenceId = body.reference_id

    // Handle new author creation
    if (body.new_author && body.new_author.name) {
      const newAuthor = await db.prepare(`
        INSERT INTO authors (name, is_fictional, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        body.new_author.name.trim(),
        body.new_author.is_fictional || false
      ).run()

      if (!newAuthor.success) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create new author'
        })
      }

      authorId = newAuthor.meta.last_row_id
    }

    // Handle new reference creation
    if (body.new_reference && body.new_reference.name) {
      const newReference = await db.prepare(`
        INSERT INTO quote_references (name, original_language, primary_type, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        body.new_reference.name.trim(),
        body.new_reference.original_language || body.language || 'en',
        body.new_reference.primary_type || 'other'
      ).run()

      if (!newReference.success) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create new reference'
        })
      }

      referenceId = newReference.meta.last_row_id
    }

    // Update the quote
    const updateResult = await db.prepare(`
      UPDATE quotes 
      SET 
        name = ?,
        language = ?,
        author_id = ?,
        reference_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name.trim(),
      body.language || 'en',
      authorId || null,
      referenceId || null,
      quoteId
    ).run()

    if (!updateResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update quote'
      })
    }

    // Fetch the updated quote with all related data
    const updatedQuoteResult = await db.prepare(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
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

    if (!updatedQuoteResult) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch updated quote'
      })
    }

    const updatedQuote = updatedQuoteResult as unknown as CreatedQuoteResult

    const transformedQuote: QuoteWithMetadata = {
      id: updatedQuote.id,
      name: updatedQuote.name,
      language: updatedQuote.language,
      author_id: updatedQuote.author_id,
      reference_id: updatedQuote.reference_id,
      user_id: updatedQuote.user_id,
      status: updatedQuote.status as any,
      moderator_id: updatedQuote.moderator_id,
      moderated_at: updatedQuote.moderated_at,
      rejection_reason: updatedQuote.rejection_reason,
      views_count: updatedQuote.views_count,
      likes_count: updatedQuote.likes_count,
      shares_count: updatedQuote.shares_count,
      is_featured: updatedQuote.is_featured,
      created_at: updatedQuote.created_at,
      updated_at: updatedQuote.updated_at,
      author: updatedQuote.author_id ? {
        id: updatedQuote.author_id,
        name: updatedQuote.author_name || '',
        is_fictional: updatedQuote.author_is_fictional || false
      } : undefined,
      reference: updatedQuote.reference_id ? {
        id: updatedQuote.reference_id,
        name: updatedQuote.reference_name || '',
        primary_type: updatedQuote.reference_type || 'other'
      } : undefined,
      user: {
        id: updatedQuote.user_id,
        name: updatedQuote.user_name || ''
      },
      tags: updatedQuote.tag_names ? updatedQuote.tag_names.split(',').map((name, index) => ({
        id: index + 1,
        name: name.trim(),
        color: updatedQuote.tag_colors?.split(',')[index]?.trim() || 'gray'
      })) : []
    }

    return {
      success: true,
      data: transformedQuote,
      message: 'Quote updated successfully'
    }

  } catch (error: any) {
    console.error('Error updating quote:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
