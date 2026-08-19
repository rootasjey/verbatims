import { db, schema } from 'hub:db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (_event) => {
  try {
    // Get a featured quote (either marked as featured or random popular quote)
    let featuredQuote = await db.select({
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
      userId: schema.quotes.userId,
      userName: schema.users.name
    })
    .from(schema.quotes)
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
        language: schema.quotes.language,
        status: schema.quotes.status,
        viewsCount: schema.quotes.viewsCount,
        likesCount: schema.quotes.likesCount,
        sharesCount: schema.quotes.sharesCount,
        isFeatured: schema.quotes.isFeatured,
        createdAt: schema.quotes.createdAt,
        updatedAt: schema.quotes.updatedAt,
        userId: schema.quotes.userId,
        userName: schema.users.name
      })
      .from(schema.quotes)
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
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, featuredQuote.id))
    .all()
    
    const provenance = await getPrimaryQuoteProvenance([featuredQuote.id])
    const primary = provenance.get(featuredQuote.id)
    const attribution = primary?.attributions.find((item: any) => item.is_primary) ?? primary?.attributions[0]

    // Transform the result
    const transformedQuote = {
      id: featuredQuote.id,
      name: featuredQuote.name,
      language: featuredQuote.language,
      status: featuredQuote.status,
      views_count: featuredQuote.viewsCount,
      likes_count: featuredQuote.likesCount,
      shares_count: featuredQuote.sharesCount,
      is_featured: featuredQuote.isFeatured,
      created_at: featuredQuote.createdAt,
      updated_at: featuredQuote.updatedAt,
      author: attribution?.author_id ? {
        id: attribution.author_id,
        name: attribution.author?.name,
        is_fictional: attribution.author?.is_fictional
      } : null,
      reference: attribution?.reference_id ? {
        id: attribution.reference_id,
        name: attribution.reference?.name,
        type: attribution.reference?.primary_type
      } : null,
      user: {
        name: featuredQuote.userName
      },
      tags: tags.map(t => ({
        name: t.name,
        color: t.color || 'gray'
      })),
      attributions: primary?.attributions,
      sources: primary?.sources,
    }
    
    return {
      success: true,
      data: transformedQuote
    }
  } catch (error) {
    console.error('Error fetching featured quote:', error)
    throwServer(500, 'Failed to fetch featured quote')
  }
})
