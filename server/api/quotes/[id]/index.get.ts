import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { ProcessedQuoteResult } from '~~/server/types'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const quote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
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
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      userName: schema.users.name
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(and(
      eq(schema.quotes.id, parseInt(quoteId)),
      eq(schema.quotes.status, 'approved')
    ))
    .get()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found'
      })
    }

    // Fetch tags for the quote
    const tags = await db.select({
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId)))
    .all()

    const transformedQuote = {
      id: quote.id,
      name: quote.name,
      language: quote.language,
      status: quote.status,
      views_count: quote.viewsCount,
      likes_count: quote.likesCount,
      shares_count: quote.sharesCount,
      is_featured: quote.isFeatured,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
      author: quote.authorId ? {
        id: quote.authorId,
        name: quote.authorName,
        is_fictional: quote.authorIsFictional,
        image_url: quote.authorImageUrl
      } : undefined,
      reference: quote.referenceId ? {
        id: quote.referenceId,
        name: quote.referenceName,
        primary_type: quote.referencePrimaryType
      } : undefined,
      user: {
        id: quote.userId,
        name: quote.userName
      },
      tags: tags.map(t => ({
        name: t.name,
        color: t.color
      }))
    }

    return {
      success: true,
      data: transformedQuote as unknown as ProcessedQuoteResult
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    
    console.error('Error fetching quote:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quote'
    })
  }
})
