import { db, schema } from 'hub:db'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    // Get liked quotes with full data and tags
    const likedQuotes = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      status: schema.quotes.status,
      userId: schema.quotes.userId,
      moderatorId: schema.quotes.moderatorId,
      moderatedAt: schema.quotes.moderatedAt,
      rejectionReason: schema.quotes.rejectionReason,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      user_name: schema.users.name,
      // user_likes.created_at is stored as SQLite datetime text despite the
      // integer timestamp mode in the Drizzle schema.
      liked_at_text: sql<string | null>`${schema.userLikes.createdAt}`,
      tag_names: sql<string>`GROUP_CONCAT(${schema.tags.name})`,
      tag_colors: sql<string>`GROUP_CONCAT(${schema.tags.color})`
    })
      .from(schema.userLikes)
      .innerJoin(schema.quotes, eq(schema.userLikes.likeableId, schema.quotes.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .leftJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
      .leftJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(and(
        eq(schema.userLikes.userId, user.id),
        eq(schema.userLikes.likeableType, 'quote'),
        eq(schema.quotes.status, 'approved')
      ))
      .groupBy(schema.quotes.id)
      .orderBy(desc(schema.userLikes.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalResult = await db.select({ total: count() })
      .from(schema.userLikes)
      .innerJoin(schema.quotes, eq(schema.userLikes.likeableId, schema.quotes.id))
      .where(and(
        eq(schema.userLikes.userId, user.id),
        eq(schema.userLikes.likeableType, 'quote'),
        eq(schema.quotes.status, 'approved')
      ))

    const total = Number(totalResult[0]?.total) || 0
    const hasMore = offset + likedQuotes.length < total

    // Process tags from GROUP_CONCAT results
    const provenance = await getPrimaryQuoteProvenance(likedQuotes.map(quote => quote.id))
    const processedQuotes = likedQuotes.map((quote: any) => {
      const { liked_at_text: likedAt, ...quoteData } = quote
      const quoteProvenance = provenance.get(quote.id)
      const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
      return {
        ...quoteData,
        liked_at: likedAt,
        author: attribution?.author_id ? attribution.author : null,
        reference: attribution?.reference_id ? attribution.reference : null,
        tags: parseTags(quote.tag_names, quote.tag_colors),
        attributions: quoteProvenance?.attributions ?? [],
        sources: quoteProvenance?.sources ?? [],
      }
    })
    
    return {
      success: true,
      data: processedQuotes,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    console.error('Dashboard liked quotes error:', error)
    throwServer(500, 'Failed to fetch liked quotes')
  }
})
