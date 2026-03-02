import { db, schema } from 'hub:db'
import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'
import { isSocialQueueStatus } from '#shared/constants/social'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const page = Math.max(parseInt(String(query.page || '1')) || 1, 1)
  const limit = Math.min(parseInt(String(query.limit || '20')) || 20, 100)
  const offset = (page - 1) * limit
  const search = String(query.search || '').trim()
  const status = String(query.status || '').trim()
  const platform = String(query.platform || 'x').trim()

  if (!isSocialPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: SOCIAL_PLATFORM_ERROR_MESSAGE })
  }

  const conditions = [eq(schema.socialQueue.platform, platform as any)]

  if (status) {
    if (!isSocialQueueStatus(status)) {
      throw createError({ statusCode: 400, statusMessage: 'status must be queued, processing, posted, or failed' })
    }
    conditions.push(eq(schema.socialQueue.status, status))
  }

  if (search) {
    conditions.push(or(
      like(schema.quotes.name, `%${search}%`),
      like(schema.authors.name, `%${search}%`),
      like(schema.quoteReferences.name, `%${search}%`)
    )!)
  }

  const whereCondition = and(...conditions)

  const rows = await db.select({
    id: schema.socialQueue.id,
    quote_id: schema.socialQueue.quoteId,
    platform: schema.socialQueue.platform,
    status: schema.socialQueue.status,
    position: schema.socialQueue.position,
    scheduled_for: schema.socialQueue.scheduledFor,
    created_at: schema.socialQueue.createdAt,
    updated_at: schema.socialQueue.updatedAt,
    quote_text: schema.quotes.name,
    quote_language: schema.quotes.language,
    author_name: schema.authors.name,
    reference_name: schema.quoteReferences.name,
    quote_posts_count: sql<number>`COALESCE((
      SELECT COUNT(*)
      FROM social_posts sp
      WHERE sp.quote_id = ${schema.socialQueue.quoteId}
        AND sp.platform = ${schema.socialQueue.platform}
        AND sp.status = 'success'
    ), 0)`.as('quote_posts_count'),
    last_posted_at: sql<string | null>`(
      SELECT MAX(sp.posted_at)
      FROM social_posts sp
      WHERE sp.quote_id = ${schema.socialQueue.quoteId}
        AND sp.platform = ${schema.socialQueue.platform}
        AND sp.status = 'success'
    )`.as('last_posted_at')
  })
  .from(schema.socialQueue)
  .leftJoin(schema.quotes, eq(schema.socialQueue.quoteId, schema.quotes.id))
  .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
  .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
  .where(whereCondition)
  .orderBy(
    asc(sql`CASE WHEN ${schema.socialQueue.status} = 'queued' THEN 0 ELSE 1 END`),
    asc(schema.socialQueue.position),
    desc(schema.socialQueue.updatedAt)
  )
  .limit(limit)
  .offset(offset)

  const totalRow = await db
    .select({ total: count() })
    .from(schema.socialQueue)
    .leftJoin(schema.quotes, eq(schema.socialQueue.quoteId, schema.quotes.id))
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(whereCondition)

  const queueStats = await db.select({
    queued: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'queued' THEN 1 ELSE 0 END)`,
    processing: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'processing' THEN 1 ELSE 0 END)`,
    posted: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'posted' THEN 1 ELSE 0 END)`,
    failed: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'failed' THEN 1 ELSE 0 END)`
  })
  .from(schema.socialQueue)
  .where(eq(schema.socialQueue.platform, platform as any))

  const total = Number(totalRow[0]?.total || 0)
  const totalPages = Math.ceil(total / limit)

  return {
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    },
    stats: {
      queued: Number(queueStats[0]?.queued || 0),
      processing: Number(queueStats[0]?.processing || 0),
      posted: Number(queueStats[0]?.posted || 0),
      failed: Number(queueStats[0]?.failed || 0)
    }
  }
})
