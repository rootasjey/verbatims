import { db, schema } from 'hub:db'
import { and, asc, count, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
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

interface SocialQueueBaseRow {
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
}

interface LatestQueuePostRow {
  queue_id: number | null
  post_url: string | null
  external_post_id: string | null
  posted_at: Date | null
  id: number
}

interface SourcePostRow {
  source_type: string
  source_id: number
  platform: string
  posted_at: Date | null
}

function getSourcePlatformKey(input: { source_type: string, source_id: number, platform: string }) {
  return `${input.source_type}:${input.source_id}:${input.platform}`
}

function toResponseTimestamp(value: Date | null): string | null {
  return value ? value.toISOString() : null
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
    updated_at: schema.socialQueue.updatedAt
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
  const queueIds = rows.map(row => row.id)
  const sourceTriples = Array.from(new Map(
    rows.map(row => [getSourcePlatformKey(row), row])
  ).values())

  const latestPostsByQueue = new Map<number, LatestQueuePostRow>()
  if (queueIds.length) {
    const latestQueuePosts = await db.select({
      queue_id: schema.socialPosts.queueId,
      post_url: schema.socialPosts.postUrl,
      external_post_id: schema.socialPosts.externalPostId,
      posted_at: schema.socialPosts.postedAt,
      id: schema.socialPosts.id
    })
      .from(schema.socialPosts)
      .where(and(
        eq(schema.socialPosts.status, 'success'),
        inArray(schema.socialPosts.queueId, queueIds)
      ))
      .orderBy(desc(schema.socialPosts.postedAt), desc(schema.socialPosts.id))

    for (const post of latestQueuePosts) {
      if (post.queue_id === null || latestPostsByQueue.has(post.queue_id)) {
        continue
      }

      latestPostsByQueue.set(post.queue_id, post)
    }
  }

  const sourcePostStats = new Map<string, { count: number, lastPostedAt: Date | null }>()
  if (sourceTriples.length) {
    const sourceConditions = sourceTriples.map(row => and(
      eq(schema.socialPosts.sourceType, row.source_type),
      eq(schema.socialPosts.sourceId, row.source_id),
      eq(schema.socialPosts.platform, row.platform as any)
    )!)

    const sourcePosts = await db.select({
      source_type: schema.socialPosts.sourceType,
      source_id: schema.socialPosts.sourceId,
      platform: schema.socialPosts.platform,
      posted_at: schema.socialPosts.postedAt
    })
      .from(schema.socialPosts)
      .where(and(
        eq(schema.socialPosts.status, 'success'),
        or(...sourceConditions)!
      ))
      .orderBy(desc(schema.socialPosts.postedAt), desc(schema.socialPosts.id))

    for (const post of sourcePosts) {
      const key = getSourcePlatformKey(post)
      const current = sourcePostStats.get(key)
      if (!current) {
        sourcePostStats.set(key, {
          count: 1,
          lastPostedAt: post.posted_at
        })
        continue
      }

      current.count += 1
    }
  }

  const resolvedDisplays = await verbatimsSocialSourceDisplayResolver.resolveDisplays(rows.map(row => ({
    sourceType: row.source_type,
    sourceId: row.source_id
  })))
  const resolvedRows = rows.map((row) => {
    const resolvedDisplay = resolvedDisplays[getSocialSourceKey({
      sourceType: row.source_type,
      sourceId: row.source_id
    })] as VerbatimsResolvedSourceDisplay | undefined
    const latestQueuePost = latestPostsByQueue.get(row.id)
    const sourceStats = sourcePostStats.get(getSourcePlatformKey(row))

    return {
      ...row,
      published_post_url: latestQueuePost?.post_url || null,
      published_external_post_id: latestQueuePost?.external_post_id || null,
      published_posted_at: toResponseTimestamp(latestQueuePost?.posted_at || null),
      quote_posts_count: sourceStats?.count || 0,
      last_posted_at: toResponseTimestamp(sourceStats?.lastPostedAt || null),
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
