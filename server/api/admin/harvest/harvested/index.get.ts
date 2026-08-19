import { db, schema } from 'hub:db'
import { eq, sql, and, desc } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = (page - 1) * limit
  const searchQuery = String(query.search || '').trim()
  const sourceType = String(query.sourceType || '').trim()

  const conditions = [eq(schema.quotes.status, 'harvested')]
  if (searchQuery) {
    conditions.push(sql`LOWER(${schema.quotes.name}) LIKE ${'%' + searchQuery.toLowerCase() + '%'}`)
  }
  if (sourceType) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${schema.quoteSources}
      INNER JOIN ${schema.quoteAttributions}
        ON ${schema.quoteSources.attributionId} = ${schema.quoteAttributions.id}
      WHERE ${schema.quoteAttributions.quoteId} = ${schema.quotes.id}
        AND ${schema.quoteSources.sourceType} = ${sourceType}
    )`)
  }

  const where = and(...conditions)

  const [quotes, countResult] = await Promise.all([
    db.select({
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
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
      .from(schema.quotes)
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.quotes.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.quotes)
      .where(where),
  ])

  const total = Number(countResult[0]?.count) || 0
  const provenance = await getPrimaryQuoteProvenance(quotes.map(quote => quote.id))
  const transformed = quotes.map((quote) => {
    const quoteProvenance = provenance.get(quote.id)
    const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
    return {
      ...quote,
      author: attribution?.author_id ? attribution.author : null,
      reference: attribution?.reference_id ? attribution.reference : null,
      attributions: quoteProvenance?.attributions ?? [],
      sources: quoteProvenance?.sources ?? [],
    }
  })

  return {
    success: true,
    data: transformed,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
