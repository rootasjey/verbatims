import { db, schema } from 'hub:db'
import { eq, and, desc, count, sql, getTableColumns } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    // Get liked quotes with full data and tags
    const likedQuotes = await db.select({
      ...getTableColumns(schema.quotes),
      author_name: schema.authors.name,
      author_is_fictional: schema.authors.isFictional,
      author_image_url: schema.authors.imageUrl,
      reference_name: schema.quoteReferences.name,
      reference_type: schema.quoteReferences.primaryType,
      user_name: schema.users.name,
      liked_at: schema.userLikes.createdAt,
      tag_names: sql<string>`GROUP_CONCAT(${schema.tags.name})`,
      tag_colors: sql<string>`GROUP_CONCAT(${schema.tags.color})`
    })
      .from(schema.userLikes)
      .innerJoin(schema.quotes, eq(schema.userLikes.likeableId, schema.quotes.id))
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .leftJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
      .leftJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(and(
        eq(schema.userLikes.userId, session.user.id),
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
        eq(schema.userLikes.userId, session.user.id),
        eq(schema.userLikes.likeableType, 'quote'),
        eq(schema.quotes.status, 'approved')
      ))

    const total = Number(totalResult[0]?.total) || 0
    const hasMore = offset + likedQuotes.length < total

    // Process tags from GROUP_CONCAT results
    const processedQuotes = likedQuotes.map((quote: any) => ({
      ...quote,
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: quote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }))
    
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
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch liked quotes'
    })
  }
})
