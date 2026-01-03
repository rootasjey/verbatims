import type { ProcessedQuoteResult } from "~/types"
import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

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
    .innerJoin(schema.quotesTags, eq(schema.tags.id, schema.quotesTags.tagId))
    .where(eq(schema.quotesTags.quoteId, parseInt(quoteId)))
    .all()

    const transformedQuote = {
      id: quote.id,
      name: quote.name,
      language: quote.originalLanguage,
      status: quote.status,
      views_count: quote.viewsCount,
      likes_count: quote.likesCount,
      shares_count: quote.sharesCount,
      is_featured: quote.isFeatured,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
      author: quote.authorId ? {
        id: quote.authorId,
        name: quote.author.name,
        is_fictional: quote.author.isFictional,
        image_url: quote.author.imageUrl
      } : undefined,
      reference: quote.referenceId ? {
        id: quote.referenceId,
        name: quote.reference.name,
        primary_type: quote.reference.primaryType
      } : undefined,
      user: {
        id: quote.userId,
        name: quote.user.name
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
