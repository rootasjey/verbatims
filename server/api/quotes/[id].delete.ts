/**
 * API: Delete Quote
 * Deletes a quote by ID (only drafts can be deleted by regular users, admins can delete any quote)
 */
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Get quote ID from URL
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote ID is required'
      })
    }

    // Get user session
    const { user } = await requireUserSession(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Check if quote exists and belongs to user
    const quote = await db.select({
      id: schema.quotes.id,
      userId: schema.quotes.userId,
      status: schema.quotes.status
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found'
      })
    }

    // Check permissions: regular users can only delete their own drafts
    // Admins and moderators can delete any quote
    const isAdmin = user.role === 'admin' || user.role === 'moderator'
    const isOwner = quote.userId === user.id
    const isDraft = quote.status === 'draft'

    if (!isAdmin && (!isOwner || !isDraft)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete your own draft quotes'
      })
    }

    // Delete quote
    await db.delete(schema.quotes)
      .where(eq(schema.quotes.id, parseInt(quoteId)))
      .run()

    return {
      success: true,
      message: 'Quote deleted successfully'
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Delete quote error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete quote'
    })
  }
})