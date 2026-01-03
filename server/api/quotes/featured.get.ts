import type {
  ApiResponse,
  FeaturedQuoteResult
} from '~/types'
import { db, schema } from 'hub:db'
import { eq, and, desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (_event): Promise<ApiResponse<any>> => {
  try {
    // Get a featured quote (either marked as featured or random popular quote)
    let featuredQuote = await db.select({
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
        isFictional: schema.authors.isFictional
      },
      reference: {
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        primaryType: schema.quoteReferences.primaryType
      },
      user: {
        name: schema.users.name
      }
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(and(
      eq(schema.quotes.status, 'approved'),
      eq(schema.quotes.isFeatured, true)
    ))
    .orderBy(desc(schema.quotes.createdAt))
    .limit(1)
    .get()

    // If no featured quote, get a popular one
    if (!featuredQuote) {
      featuredQuote = await db.select({
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
          isFictional: schema.authors.isFictional
        },
        reference: {
          id: schema.quoteReferences.id,
          name: schema.quoteReferences.name,
          primaryType: schema.quoteReferences.primaryType
        },
        user: {
          name: schema.users.name
        }
      })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .where(eq(schema.quotes.status, 'approved'))
      .orderBy(desc(sql`${schema.quotes.likesCount} + ${schema.quotes.viewsCount}`))
      .limit(1)
      .get()
    }

    if (!featuredQuote) {
      return {
        success: true,
        data: null
      }
    }
    
    // Fetch tags for the quote
    const tags = await db.select({
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quotesTags, eq(schema.tags.id, schema.quotesTags.tagId))
    .where(eq(schema.quotesTags.quoteId, featuredQuote.id))
    .all()
    
    // Transform the result
    const transformedQuote = {
      id: featuredQuote.id,
      name: featuredQuote.name,
      language: featuredQuote.originalLanguage,
      status: featuredQuote.status,
      views_count: featuredQuote.viewsCount,
      likes_count: featuredQuote.likesCount,
      shares_count: featuredQuote.sharesCount,
      is_featured: featuredQuote.isFeatured,
      created_at: featuredQuote.createdAt,
      updated_at: featuredQuote.updatedAt,
      author: featuredQuote.authorId ? {
        id: featuredQuote.authorId,
        name: featuredQuote.author.name,
        is_fictional: featuredQuote.author.isFictional
      } : null,
      reference: featuredQuote.referenceId ? {
        id: featuredQuote.referenceId,
        name: featuredQuote.reference.name,
        type: featuredQuote.reference.primaryType
      } : null,
      user: {
        name: featuredQuote.user.name
      },
      tags: tags.map(t => ({
        name: t.name,
        color: t.color || 'gray'
      }))
    }
    
    return {
      success: true,
      data: transformedQuote
    }
  } catch (error) {
    console.error('Error fetching featured quote:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch featured quote'
    })
  }
})
