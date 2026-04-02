import { db, schema } from 'hub:db'
import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE } from '#shared/constants/social'
import { isSocialQueueStatus } from '#shared/constants/social'
import type { SocialSourceDisplay } from '@verbatims/social-autopost-core'
import { getSocialSourceKey } from '@verbatims/social-autopost-core'
import {
  type VerbatimsResolvedSourceDisplay,
  verbatimsSocialSourceDisplayResolver,
  verbatimsSocialSourceSearchResolver
} from '../../../utils/social-autopost-verbatims'

interface SocialQueueRow {
  id: number
  quote_id: number
  source_type: string
  source_id: number
  platform: string
  status: string
  position: number
  scheduled_for: Date | null
  created_at: Date | null
  updated_at: Date | null
  published_post_url: string | null
  published_external_post_id: string | null
  published_posted_at: string | null
  quote_posts_count: number
  last_posted_at: string | null
}

function buildResolvedContent(display: SocialSourceDisplay | undefined, row: SocialQueueRow) {
  const canonicalPath = display?.canonicalPath || (row.quote_id ? `/quotes/${row.quote_id}` : null)

  return {
    source_type: row.source_type,
    source_id: row.source_id,
    primary_text: display?.primaryText || null,
    secondary_text: display?.secondaryText || null,
    canonical_path: canonicalPath,
    title: display?.title || null,
    subtitle: display?.subtitle || null,
    language: display?.language || null
  }
}

async function buildSourceSearchCondition(search: string) {
  const normalizedSearch = search.trim()
  if (!normalizedSearch) {
    return null
  }

  const sourceConditions = [
    like(schema.socialQueue.sourceType, `%${normalizedSearch}%`),
    like(sql<string>`CAST(${schema.socialQueue.sourceId} AS TEXT)`, `%${normalizedSearch}%`)
  ]

  const sourceMatches = await verbatimsSocialSourceSearchResolver.searchSources(normalizedSearch)
  for (const sourceMatch of sourceMatches) {
    sourceConditions.push(and(
      eq(schema.socialQueue.sourceType, sourceMatch.sourceType),
      eq(schema.socialQueue.sourceId, Number(sourceMatch.sourceId))
    )!)
  }

  return or(...sourceConditions)!
}

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
    const sourceSearchCondition = await buildSourceSearchCondition(search)
    if (sourceSearchCondition) {
      conditions.push(sourceSearchCondition)
    }
  }

  const whereCondition = and(...conditions)

  const rows = await db.select({
    id: schema.socialQueue.id,
    quote_id: schema.socialQueue.quoteId,
    source_type: schema.socialQueue.sourceType,
    source_id: schema.socialQueue.sourceId,
    platform: schema.socialQueue.platform,
    status: schema.socialQueue.status,
    position: schema.socialQueue.position,
    scheduled_for: schema.socialQueue.scheduledFor,
    created_at: schema.socialQueue.createdAt,
    updated_at: schema.socialQueue.updatedAt,
    published_post_url: sql<string | null>`(
      SELECT sp.post_url
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
        AND sp.status = 'success'
      ORDER BY sp.posted_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_post_url'),
    published_external_post_id: sql<string | null>`(
      SELECT sp.external_post_id
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
        AND sp.status = 'success'
      ORDER BY sp.posted_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_external_post_id'),
    published_posted_at: sql<string | null>`(
      SELECT sp.posted_at
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
        AND sp.status = 'success'
      ORDER BY sp.posted_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_posted_at'),
    quote_posts_count: sql<number>`COALESCE((
      SELECT COUNT(*)
      FROM social_posts sp
      WHERE sp.source_type = ${schema.socialQueue.sourceType}
        AND sp.source_id = ${schema.socialQueue.sourceId}
        AND sp.platform = ${schema.socialQueue.platform}
        AND sp.status = 'success'
    ), 0)`.as('quote_posts_count'),
    last_posted_at: sql<string | null>`(
      SELECT MAX(sp.posted_at)
      FROM social_posts sp
      WHERE sp.source_type = ${schema.socialQueue.sourceType}
        AND sp.source_id = ${schema.socialQueue.sourceId}
        AND sp.platform = ${schema.socialQueue.platform}
        AND sp.status = 'success'
    )`.as('last_posted_at')
  })
  .from(schema.socialQueue)
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
  const resolvedDisplays = await verbatimsSocialSourceDisplayResolver.resolveDisplays(rows.map(row => ({
    sourceType: row.source_type,
    sourceId: row.source_id
  })))
  const resolvedRows = rows.map((row) => {
    const resolvedDisplay = resolvedDisplays[getSocialSourceKey({
      sourceType: row.source_type,
      sourceId: row.source_id
    })] as VerbatimsResolvedSourceDisplay | undefined

    return {
      ...row,
      quote_text: resolvedDisplay?.quoteText || null,
      quote_language: resolvedDisplay?.quoteLanguage || null,
      author_name: resolvedDisplay?.authorName || null,
      reference_name: resolvedDisplay?.referenceName || null,
      resolved_content: buildResolvedContent(resolvedDisplay, row as SocialQueueRow)
    }
  })

  return {
    success: true,
    data: resolvedRows,
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
