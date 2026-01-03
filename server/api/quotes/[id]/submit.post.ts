import type { Quote, CreatedQuoteResult } from "~/types"
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
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

    // Check if quote exists, is a draft, and belongs to the user
    const quote = await db.select()
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(quoteId)),
        eq(schema.quotes.status, 'draft'),
        eq(schema.quotes.userId, session.user.id)
      ))
      .get()

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
    await db.update(schema.quotes)
      .set({ status: 'pending' })
      .where(eq(schema.quotes.id, parseInt(quoteId)))

    // Fetch the updated quote with all related data
    const updatedQuoteData = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      originalLanguage: schema.quotes.originalLanguage,
      status: schema.quotes.status,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      author: {
        id: schema.authors.id,
        name: schema.authors.name,
        isFictional: schema.authors.isFictional,
        imageUrl: schema.authors.imageUrl
      },
      reference: {
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        primaryType: schema.quoteReferences.primaryType
      },
      user: {
        id: schema.users.id,
        name: schema.users.name
      }
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

    if (!updatedQuoteData) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch updated quote'
      })
    }

    // Fetch tags
    const tags = await db.select({
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId)))
    .all()

    // Process the quote result
    const processedQuote = {
      ...updatedQuoteData,
      author_name: updatedQuoteData.author?.name || null,
      author_is_fictional: updatedQuoteData.author?.isFictional || false,
      author_image_url: updatedQuoteData.author?.imageUrl || null,
      reference_name: updatedQuoteData.reference?.name || null,
      reference_type: updatedQuoteData.reference?.primaryType || null,
      user_name: updatedQuoteData.user?.name || null,
      tags
    }

    return {
      success: true,
      data: processedQuote,
      message: 'Quote submitted successfully and is now pending moderation'
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Quote submission error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit quote'
    })
  }
})
