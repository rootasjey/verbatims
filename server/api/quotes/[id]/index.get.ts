import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { ProcessedQuoteResult } from '~~/server/types'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'

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
      userId: schema.quotes.userId,
      userName: schema.users.name
    })
    .from(schema.quotes)
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
    const [tags, provenance] = await Promise.all([
      db.select({
      name: schema.tags.name,
      color: schema.tags.color
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .where(eq(schema.quoteTags.quoteId, parseInt(quoteId!)))
        .all(),
      getQuoteProvenance(parseInt(quoteId!)),
    ])

    const primaryAttribution = provenance.attributions.find(attribution => attribution.is_primary) ?? provenance.attributions[0]
    const primarySource = provenance.sources.find(source => source.is_primary) ?? provenance.sources[0]

    const transformedQuote = {
      id: q.id,
      name: q.name,
      language: q.language,
      status: q.status,
      views_count: q.viewsCount,
      likes_count: q.likesCount,
      shares_count: q.sharesCount,
      is_featured: q.isFeatured,
      source_type: primarySource?.source_type,
      source_url: primarySource?.source_url,
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      author: primaryAttribution?.author_id ? {
        id: primaryAttribution.author_id,
        name: primaryAttribution.author?.name,
        is_fictional: primaryAttribution.author?.is_fictional,
        image_url: primaryAttribution.author?.image_url
      } : undefined,
      reference: primaryAttribution?.reference_id ? {
        id: primaryAttribution.reference_id,
        name: primaryAttribution.reference?.name,
        primary_type: primaryAttribution.reference?.primary_type
      } : undefined,
      user: {
        id: q.userId,
        name: q.userName
      },
      tags: tags.map(t => ({
        name: t.name,
        color: t.color
      })),
      attributions: provenance.attributions,
      sources: provenance.sources,
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
