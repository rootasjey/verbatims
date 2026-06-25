import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { ProcessedQuoteResult } from '~~/server/types'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throwServer(400, 'Invalid quote ID')
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
      eq(schema.quotes.id, parseInt(quoteId!)),
      eq(schema.quotes.status, 'approved')
    ))
    .get()

    if (!quote) {
      throwServer(404, 'Quote not found')
    }
    const q = quote!

    // Fetch tags for the quote
    const tags = await db.select({
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId!)))
    .all()

    const transformedQuote = {
      id: q.id,
      name: q.name,
      language: q.language,
      status: q.status,
      views_count: q.viewsCount,
      likes_count: q.likesCount,
      shares_count: q.sharesCount,
      is_featured: q.isFeatured,
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      author: q.authorId ? {
        id: q.authorId,
        name: q.authorName,
        is_fictional: q.authorIsFictional,
        image_url: q.authorImageUrl
      } : undefined,
      reference: q.referenceId ? {
        id: q.referenceId,
        name: q.referenceName,
        primary_type: q.referencePrimaryType
      } : undefined,
      user: {
        id: q.userId,
        name: q.userName
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
    throwServer(500, 'Failed to fetch quote')
  }
})
