import { db, schema } from 'hub:db'
import { eq, and, like, or, desc, count, sql, inArray } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 100)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    const status = query.status as string
    const language = query.language as string
    const search = query.search as string || ''

    // Build conditions array for dynamic filtering
    const conditions = [eq(schema.quotes.userId, user.id)]

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) {
      conditions.push(eq(schema.quotes.status, status as any))
    }

    if (language) {
      conditions.push(eq(schema.quotes.language, language as any))
    }

    if (search) {
      const searchCondition = or(
        like(schema.quotes.name, `%${search}%`),
        sql`EXISTS (
          SELECT 1 FROM ${schema.quoteAttributions}
          LEFT JOIN ${schema.authors} ON ${schema.quoteAttributions.authorId} = ${schema.authors.id}
          LEFT JOIN ${schema.quoteReferences} ON ${schema.quoteAttributions.referenceId} = ${schema.quoteReferences.id}
          WHERE ${schema.quoteAttributions.quoteId} = ${schema.quotes.id}
            AND (${schema.authors.name} LIKE ${`%${search}%`} OR ${schema.quoteReferences.name} LIKE ${`%${search}%`})
        )`,
      )
      if (searchCondition) conditions.push(searchCondition)
    }

    // Get user's submissions with related data
    const submissions = await db.select({
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
      moderator_name: schema.users.name,
    })
      .from(schema.quotes)
      .leftJoin(schema.users, eq(schema.quotes.moderatorId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.quotes.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalResult = await db.select({ total: count() })
      .from(schema.quotes)
      .where(and(...conditions))

    const total = Number(totalResult[0]?.total) || 0
    const hasMore = offset + submissions.length < total

    const likedQuoteIds = new Set<number>()
    if (submissions.length) {
      for (const quoteIdBatch of chunkForD1Bindings(submissions.map(submission => submission.id), 1, 2)) {
        const likes = await db.select({ quoteId: schema.userLikes.likeableId })
          .from(schema.userLikes)
          .where(and(
            eq(schema.userLikes.userId, user.id),
            eq(schema.userLikes.likeableType, 'quote'),
            inArray(schema.userLikes.likeableId, quoteIdBatch)
          ))
        for (const like of likes) likedQuoteIds.add(like.quoteId)
      }
    }

    // Get tags for each submission
    const provenance = await getPrimaryQuoteProvenance(submissions.map(submission => submission.id))
    const processedSubmissions = await Promise.all(submissions.map(async (submission: any) => {
      // Get tags for this quote
      const tags = await db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .where(eq(schema.quoteTags.quoteId, submission.id))

      const quoteProvenance = provenance.get(submission.id)
      const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
      return {
        ...submission,
        is_liked: likedQuoteIds.has(submission.id),
        author: attribution?.author_id ? attribution.author : null,
        reference: attribution?.reference_id ? attribution.reference : null,
        tags,
        attributions: quoteProvenance?.attributions ?? [],
        sources: quoteProvenance?.sources ?? [],
      }
    }))
    
    return {
      success: true,
      data: processedSubmissions,
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

    console.error('Dashboard submissions error:', error)
    throwServer(500, 'Failed to fetch submissions')
  }
})
