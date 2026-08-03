import { db, schema } from 'hub:db'
import { and, asc, count, desc, eq, gt, gte, inArray, like, lt, lte, not, notInArray, or, sql } from 'drizzle-orm'
import { isSocialPlatform, SOCIAL_PLATFORM_ERROR_MESSAGE, SOCIAL_PLATFORM_LABELS, type SocialPlatform } from '#shared/constants/social'
import { isSocialQueueStatus } from '#shared/constants/social'
import type { SocialSourceDisplay } from '@verbatims/social-autopost-core'
import { getSocialSourceKey } from '@verbatims/social-autopost-core'
import {
  type VerbatimsResolvedSourceDisplay,
  verbatimsSocialSourceDisplayResolver,
  verbatimsSocialSourceSearchResolver
} from './social-autopost-verbatims'
import {
  resolveXProviderConfig,
  resolveBlueskyProviderConfig,
  resolvePinterestProviderConfig,
  resolveInstagramEnabledConfig,
  resolveThreadsEnabledConfig,
  resolveFacebookEnabledConfig
} from './social-provider-config'
import { runSocialAutopostWithOptions } from './social-autopost'

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
}

function toResponseTimestamp(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function getSourcePlatformKey(input: { source_type: string, source_id: number, platform: string }) {
  return `${input.source_type}:${input.source_id}:${input.platform}`
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

export interface AddQuotesToQueueInput {
  quoteIds: number[]
  platform: string
  scheduledFor?: string | Date | null
  createdBy?: number | null
}

export interface AddRandomQuotesToQueueInput {
  platform: string
  count?: number
  language?: string
  createdBy?: number | null
}

export interface ClearSocialQueueInput {
  platform: string
  confirm: boolean
  scope: 'all' | 'finished'
}

export interface ReorderSocialQueueInput {
  id: number
  direction?: 'up' | 'down'
  beforeId?: number | null
}

export interface ListSocialQueueInput {
  page?: number | string
  limit?: number | string
  search?: string
  status?: string
  platform?: string
}

export interface ListSocialPostsInput {
  page?: number | string
  limit?: number | string
  platform?: string
  status?: string
}

export async function addQuotesToQueue(input: AddQuotesToQueueInput) {
  const quoteIds = Array.isArray(input.quoteIds)
    ? input.quoteIds.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0)
    : []

  if (!quoteIds.length) {
    throwServer(400, 'quoteIds is required')
  }
  if (quoteIds.length > 200) {
    throwServer(400, 'Too many quote IDs (max 200)')
  }

  const platform = String(input.platform || 'x')
  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const scheduledFor = input.scheduledFor ? new Date(String(input.scheduledFor)) : null
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    throwServer(400, 'Invalid scheduledFor value')
  }

  const approvedQuotes = await db
    .select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(inArray(schema.quotes.id, quoteIds))

  const approvedIdSet = new Set(approvedQuotes.map(q => q.id))
  const validQuoteIds = quoteIds.filter((id: number) => approvedIdSet.has(id))

  if (!validQuoteIds.length) {
    throwServer(400, 'No valid quotes found')
  }

  const maxPositionRow = await db.select({
    maxPosition: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
  })
  .from(schema.socialQueue)
  .where(eq(schema.socialQueue.platform, platform as any))

  const basePosition = Number(maxPositionRow[0]?.maxPosition || 0)

  const values = validQuoteIds.map((quoteId: number, index: number) => ({
    quoteId,
    sourceType: 'quote',
    sourceId: quoteId,
    platform: platform as any,
    status: 'queued' as const,
    position: basePosition + index + 1,
    scheduledFor: scheduledFor || undefined,
    createdBy: input.createdBy ?? undefined
  }))

  const BATCH_SIZE = 10
  const inserted: Array<{
    id: number
    quoteId: number
    sourceType: string
    sourceId: number
    position: number
    status: string
  }> = []

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE)
    const result = await db.insert(schema.socialQueue).values(batch).returning({
      id: schema.socialQueue.id,
      quoteId: schema.socialQueue.quoteId,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      position: schema.socialQueue.position,
      status: schema.socialQueue.status
    })
    inserted.push(...result)
  }

  return inserted
}

export async function addRandomQuotesToQueue(input: AddRandomQuotesToQueueInput) {
  const requestedCount = Number(input.count || 5)
  const count = Math.min(Math.max(Number.isInteger(requestedCount) ? requestedCount : 5, 1), 100)
  const platform = String(input.platform || 'x')
  const language = String(input.language || '').trim()

  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const filters = [eq(schema.quotes.status, 'approved')]
  if (language) {
    filters.push(eq(schema.quotes.language, language as any))
  }

  const randomQuotes = await db
    .select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(and(...filters))
    .orderBy(sql`RANDOM()`)
    .limit(count)

  if (!randomQuotes.length) {
    return []
  }

  const maxPositionRow = await db.select({
    maxPosition: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
  })
  .from(schema.socialQueue)
  .where(eq(schema.socialQueue.platform, platform as any))

  const basePosition = Number(maxPositionRow[0]?.maxPosition || 0)

  const values = randomQuotes.map((quote, index) => ({
    quoteId: quote.id,
    sourceType: 'quote',
    sourceId: quote.id,
    platform: platform as any,
    status: 'queued' as const,
    position: basePosition + index + 1,
    createdBy: input.createdBy ?? undefined
  }))

  const BATCH_SIZE = 10
  const inserted: Array<{
    id: number
    quoteId: number
    sourceType: string
    sourceId: number
    position: number
  }> = []

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE)
    const result = await db.insert(schema.socialQueue).values(batch).returning({
      id: schema.socialQueue.id,
      quoteId: schema.socialQueue.quoteId,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      position: schema.socialQueue.position
    })
    inserted.push(...result)
  }

  return inserted
}

export async function deleteSocialQueueItem(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid queue id')
  }

  const existing = await db
    .select({
      id: schema.socialQueue.id,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      platform: schema.socialQueue.platform,
      status: schema.socialQueue.status,
      position: schema.socialQueue.position
    })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)
    .get()

  if (!existing) throwServer(404, 'Queue item not found')

  await db.delete(schema.socialQueue).where(eq(schema.socialQueue.id, id))

  if (existing.status === 'queued') {
    await db.update(schema.socialQueue)
      .set({
        position: sql`${schema.socialQueue.position} - 1`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(and(
        eq(schema.socialQueue.platform, existing.platform),
        eq(schema.socialQueue.status, 'queued'),
        gt(schema.socialQueue.position, existing.position)
      ))
  }

  return {
    deleted: true,
    id: existing.id,
    sourceType: existing.sourceType,
    sourceId: existing.sourceId
  }
}

export async function clearSocialQueue(input: ClearSocialQueueInput) {
  const platform = String(input.platform || '').trim()
  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }
  if (input.scope !== 'all' && input.scope !== 'finished') {
    throwServer(400, 'scope must be all or finished')
  }
  if (!input.confirm) {
    throwServer(400, 'Confirmation required to clear queue')
  }

  const condition = input.scope === 'finished'
    ? and(
      eq(schema.socialQueue.platform, platform as any),
      or(
        eq(schema.socialQueue.status, 'posted'),
        eq(schema.socialQueue.status, 'failed')
      )
    )
    : eq(schema.socialQueue.platform, platform as any)

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(condition)

  const sourceBreakdown = await db
    .select({
      sourceType: schema.socialQueue.sourceType,
      total: sql<number>`COUNT(*)`
    })
    .from(schema.socialQueue)
    .where(condition)
    .groupBy(schema.socialQueue.sourceType)

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .delete(schema.socialQueue)
      .where(condition)
  }

  return {
    deleted: true,
    platform,
    deletedCount: total,
    sourceTypes: sourceBreakdown.map(entry => ({
      sourceType: entry.sourceType,
      count: Number(entry.total || 0)
    }))
  }
}

export async function requeueFailedSocialQueueItems(platform: string) {
  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const failedCondition = and(
    eq(schema.socialQueue.platform, platform as any),
    eq(schema.socialQueue.status, 'failed')
  )

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(failedCondition)

  const total = Number(countResult[0]?.total || 0)

  if (total > 0) {
    await db
      .update(schema.socialQueue)
      .set({
        status: 'queued',
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(failedCondition)
  }

  return {
    requeued: true,
    platform,
    requeuedCount: total
  }
}

export async function requeueSocialQueueItem(id: number) {
  if (!id) {
    throwServer(400, 'Queue item id is required')
  }

  const item = await db.select({ id: schema.socialQueue.id, status: schema.socialQueue.status })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)

  if (!item.length) {
    throwServer(404, 'Queue item not found')
  }

  if (item[0]!.status !== 'failed') {
    throwServer(400, 'Only failed items can be re-queued')
  }

  await db.update(schema.socialQueue)
    .set({ status: 'queued', updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.socialQueue.id, id))

  return { requeued: true, id }
}

export async function reorderSocialQueueItem(input: ReorderSocialQueueInput) {
  const id = Number(input.id)
  const direction = String(input.direction || '') as 'up' | 'down'
  const beforeId = input.beforeId !== undefined ? (input.beforeId === null ? null : Number(input.beforeId)) : undefined

  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid queue id')
  }

  const current = await db
    .select({
      id: schema.socialQueue.id,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      platform: schema.socialQueue.platform,
      status: schema.socialQueue.status,
      position: schema.socialQueue.position
    })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.id, id))
    .limit(1)
    .get()

  if (!current) throwServer(404, 'Queue item not found')

  // --- Drag-and-drop mode: place relative to another item ---
  if (beforeId !== undefined) {
    if (beforeId === id) {
      return { moved: false }
    }

    let targetPos: number

    if (beforeId === null) {
      const last = await db
        .select({ position: schema.socialQueue.position })
        .from(schema.socialQueue)
        .where(and(
          eq(schema.socialQueue.platform, current.platform),
          eq(schema.socialQueue.status, 'queued'),
          not(eq(schema.socialQueue.id, id))
        ))
        .orderBy(desc(schema.socialQueue.position))
        .limit(1)
        .get()

      targetPos = (last?.position ?? 0) + 1
    } else {
      const target = await db
        .select({ position: schema.socialQueue.position })
        .from(schema.socialQueue)
        .where(eq(schema.socialQueue.id, beforeId))
        .limit(1)
        .get()

      if (!target) throwServer(404, 'Target queue item not found')
      targetPos = target.position
    }

    const oldPos = current.position

    if (targetPos === oldPos) {
      return { moved: false }
    }

    if (targetPos > oldPos) {
      await db.update(schema.socialQueue)
        .set({
          position: sql`${schema.socialQueue.position} - 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(and(
          eq(schema.socialQueue.platform, current.platform),
          eq(schema.socialQueue.status, 'queued'),
          gt(schema.socialQueue.position, oldPos),
          lte(schema.socialQueue.position, targetPos)
        ))

      await db.update(schema.socialQueue)
        .set({
          position: targetPos,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(schema.socialQueue.id, id))
    } else {
      await db.update(schema.socialQueue)
        .set({
          position: sql`${schema.socialQueue.position} + 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(and(
          eq(schema.socialQueue.platform, current.platform),
          eq(schema.socialQueue.status, 'queued'),
          gte(schema.socialQueue.position, targetPos),
          lt(schema.socialQueue.position, oldPos)
        ))

      await db.update(schema.socialQueue)
        .set({
          position: targetPos,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(schema.socialQueue.id, id))
    }

    return { moved: true, id: current.id, position: targetPos }
  }

  // --- Legacy direction-based reorder ---
  if (!['up', 'down'].includes(direction)) {
    throwServer(400, 'direction must be up or down')
  }

  const adjacent = direction === 'up'
    ? await db
      .select({ id: schema.socialQueue.id, position: schema.socialQueue.position })
      .from(schema.socialQueue)
      .where(and(
        eq(schema.socialQueue.platform, current.platform),
        eq(schema.socialQueue.status, 'queued'),
        lt(schema.socialQueue.position, current.position)
      ))
      .orderBy(desc(schema.socialQueue.position))
      .limit(1)
      .get()
    : await db
      .select({ id: schema.socialQueue.id, position: schema.socialQueue.position })
      .from(schema.socialQueue)
      .where(and(
        eq(schema.socialQueue.platform, current.platform),
        eq(schema.socialQueue.status, 'queued'),
        gt(schema.socialQueue.position, current.position)
      ))
      .orderBy(asc(schema.socialQueue.position))
      .limit(1)
      .get()

  if (!adjacent) {
    return { moved: false }
  }

  await db.update(schema.socialQueue)
    .set({
      position: adjacent.position,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.socialQueue.id, current.id))

  await db.update(schema.socialQueue)
    .set({
      position: current.position,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.socialQueue.id, adjacent.id))

  return {
    moved: true,
    id: current.id,
    sourceType: current.sourceType,
    sourceId: current.sourceId,
    position: adjacent.position
  }
}

export async function runSocialAutopostNow(input: { platform?: SocialPlatform; baseSiteUrl: string }) {
  const selectedPlatform = input.platform

  if (selectedPlatform === 'instagram' || selectedPlatform === 'threads' || selectedPlatform === 'pinterest' || selectedPlatform === 'facebook') {
    const host = (() => {
      try {
        return new URL(input.baseSiteUrl).hostname.toLowerCase()
      } catch {
        return ''
      }
    })()

    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')
    if (isLocalHost) {
      const providerLabel = selectedPlatform === 'threads'
        ? 'Threads'
        : selectedPlatform === 'facebook'
          ? 'Facebook'
          : selectedPlatform === 'pinterest'
            ? 'Pinterest'
            : 'Instagram'

      const providerRequirement = selectedPlatform === 'pinterest'
        ? 'a public HTTPS quote URL in the pin link field'
        : selectedPlatform === 'facebook'
          ? 'a public image URL reachable by Facebook'
          : 'a public JPEG URL'

      return {
        success: false,
        reason: `${providerLabel} requires ${providerRequirement}. Set NUXT_PUBLIC_SITE_URL to a public domain (not localhost) before using Run now.`
      }
    }
  }

  try {
    const result = await runSocialAutopostWithOptions({ force: true, platform: selectedPlatform, baseSiteUrl: input.baseSiteUrl })

    if (result && typeof result === 'object' && 'skipped' in result && !('success' in result)) {
      return {
        ...result,
        success: false,
        reason: (result as { reason?: string }).reason || 'No post was published'
      }
    }

    return result
  } catch (error: any) {
    console.error('[social-queue/run-now] failed', {
      platform: selectedPlatform,
      baseSiteUrl: input.baseSiteUrl,
      message: error?.message || error
    })

    return {
      success: false,
      reason: error?.message || 'Unexpected error while running social autopost'
    }
  }
}

export async function listSocialQueue(input: ListSocialQueueInput) {
  const page = Math.max(parseInt(String(input.page || '1')) || 1, 1)
  const limit = Math.min(parseInt(String(input.limit || '20')) || 20, 100)
  const offset = (page - 1) * limit
  const search = String(input.search || '').trim()
  const status = String(input.status || '').trim()
  const platform = String(input.platform || 'x').trim()

  if (!isSocialPlatform(platform)) {
    throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
  }

  const conditions = [eq(schema.socialQueue.platform, platform as any)]

  if (status) {
    if (status === 'active') {
      conditions.push(notInArray(schema.socialQueue.status, ['posted']))
    } else {
      if (!isSocialQueueStatus(status)) {
        throwServer(400, 'status must be queued, processing, posted, or failed')
      }
      conditions.push(eq(schema.socialQueue.status, status))
    }
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

  const latestPostsByQueue = new Map<number, { post_url: string | null, external_post_id: string | null, posted_at: Date | null }>()
  const failedPostsByQueue = new Map<number, { error_message: string | null, posted_at: Date | null }>()
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

      latestPostsByQueue.set(post.queue_id, {
        post_url: post.post_url,
        external_post_id: post.external_post_id,
        posted_at: post.posted_at
      })
    }

    const failedPosts = await db.select({
      queue_id: schema.socialPosts.queueId,
      error_message: schema.socialPosts.errorMessage,
      posted_at: schema.socialPosts.postedAt,
      id: schema.socialPosts.id
    })
      .from(schema.socialPosts)
      .where(and(
        eq(schema.socialPosts.status, 'failed'),
        inArray(schema.socialPosts.queueId, queueIds)
      ))
      .orderBy(desc(schema.socialPosts.postedAt), desc(schema.socialPosts.id))

    for (const post of failedPosts) {
      if (post.queue_id === null || failedPostsByQueue.has(post.queue_id)) {
        continue
      }

      failedPostsByQueue.set(post.queue_id, {
        error_message: post.error_message,
        posted_at: post.posted_at
      })
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
    const failedPost = failedPostsByQueue.get(row.id)
    const sourceStats = sourcePostStats.get(getSourcePlatformKey(row))

    return {
      ...row,
      published_post_url: latestQueuePost?.post_url || null,
      published_external_post_id: latestQueuePost?.external_post_id || null,
      published_posted_at: toResponseTimestamp(latestQueuePost?.posted_at || null),
      error_message: failedPost?.error_message || null,
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
    queue: resolvedRows,
    stats: {
      queued: Number(queueStats[0]?.queued || 0),
      processing: Number(queueStats[0]?.processing || 0),
      posted: Number(queueStats[0]?.posted || 0),
      failed: Number(queueStats[0]?.failed || 0)
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  }
}

export async function getSocialQueueItem(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid queue id')
  }

  const row = await db.select({
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
    .where(eq(schema.socialQueue.id, id))
    .limit(1)
    .get()

  if (!row) throwServer(404, 'Queue item not found')

  const resolvedDisplays = await verbatimsSocialSourceDisplayResolver.resolveDisplays([{
    sourceType: row.source_type,
    sourceId: row.source_id
  }])
  const resolvedDisplay = resolvedDisplays[getSocialSourceKey({
    sourceType: row.source_type,
    sourceId: row.source_id
  })] as VerbatimsResolvedSourceDisplay | undefined

  const latestQueuePost = await db.select({
    post_url: schema.socialPosts.postUrl,
    external_post_id: schema.socialPosts.externalPostId,
    posted_at: schema.socialPosts.postedAt
  })
    .from(schema.socialPosts)
    .where(and(eq(schema.socialPosts.status, 'success'), eq(schema.socialPosts.queueId, id)))
    .orderBy(desc(schema.socialPosts.postedAt), desc(schema.socialPosts.id))
    .limit(1)
    .get()

  const failedPost = await db.select({
    error_message: schema.socialPosts.errorMessage,
    posted_at: schema.socialPosts.postedAt
  })
    .from(schema.socialPosts)
    .where(and(eq(schema.socialPosts.status, 'failed'), eq(schema.socialPosts.queueId, id)))
    .orderBy(desc(schema.socialPosts.postedAt), desc(schema.socialPosts.id))
    .limit(1)
    .get()

  const sourceStats = await db.select({
    count: sql<number>`COUNT(*)`
  })
    .from(schema.socialPosts)
    .where(and(
      eq(schema.socialPosts.status, 'success'),
      eq(schema.socialPosts.sourceType, row.source_type),
      eq(schema.socialPosts.sourceId, row.source_id),
      eq(schema.socialPosts.platform, row.platform as any)
    ))
    .get()

  return {
    ...row,
    published_post_url: latestQueuePost?.post_url || null,
    published_external_post_id: latestQueuePost?.external_post_id || null,
    published_posted_at: toResponseTimestamp(latestQueuePost?.posted_at || null),
    error_message: failedPost?.error_message || null,
    quote_posts_count: Number(sourceStats?.count || 0),
    quote_text: resolvedDisplay?.quoteText || null,
    quote_language: resolvedDisplay?.quoteLanguage || null,
    author_name: resolvedDisplay?.authorName || null,
    reference_name: resolvedDisplay?.referenceName || null,
    resolved_content: buildResolvedContent(resolvedDisplay, row as SocialQueueRow)
  }
}

export async function listSocialPlatforms() {
  const [x, bluesky, pinterest, instagram, threads, facebook] = await Promise.all([
    resolveXProviderConfig(),
    resolveBlueskyProviderConfig(),
    resolvePinterestProviderConfig(),
    resolveInstagramEnabledConfig(),
    resolveThreadsEnabledConfig(),
    resolveFacebookEnabledConfig()
  ])

  const enabledByPlatform: Record<SocialPlatform, boolean> = {
    x: x.enabled,
    bluesky: bluesky.enabled,
    instagram: instagram.enabled,
    threads: threads.enabled,
    facebook: facebook.enabled,
    pinterest: pinterest.enabled
  }

  const stats = await db.select({
    platform: schema.socialQueue.platform,
    status: schema.socialQueue.status,
    total: sql<number>`COUNT(*)`
  })
    .from(schema.socialQueue)
    .groupBy(schema.socialQueue.platform, schema.socialQueue.status)

  const statsByPlatform = new Map<SocialPlatform, { queued: number, processing: number, posted: number, failed: number }>()
  for (const row of stats) {
    if (!isSocialPlatform(row.platform)) continue
    const entry = statsByPlatform.get(row.platform) || { queued: 0, processing: 0, posted: 0, failed: 0 }
    const status = row.status as SocialQueueRow['status']
    if (status === 'queued' || status === 'processing' || status === 'posted' || status === 'failed') {
      entry[status] = Number(row.total || 0)
    }
    statsByPlatform.set(row.platform, entry)
  }

  const platforms = (Object.keys(enabledByPlatform) as SocialPlatform[]).map(platform => ({
    platform,
    label: SOCIAL_PLATFORM_LABELS[platform],
    enabled: enabledByPlatform[platform],
    queue: statsByPlatform.get(platform) || { queued: 0, processing: 0, posted: 0, failed: 0 }
  }))

  return platforms
}

export async function listSocialPosts(input: ListSocialPostsInput) {
  const page = Math.max(parseInt(String(input.page || '1')) || 1, 1)
  const limit = Math.min(parseInt(String(input.limit || '20')) || 20, 100)
  const offset = (page - 1) * limit
  const platform = String(input.platform || '').trim()
  const status = String(input.status || '').trim()

  const conditions = []

  if (platform) {
    if (!isSocialPlatform(platform)) {
      throwServer(400, SOCIAL_PLATFORM_ERROR_MESSAGE)
    }
    conditions.push(eq(schema.socialPosts.platform, platform as any))
  }

  if (status) {
    if (status !== 'success' && status !== 'failed') {
      throwServer(400, 'status must be success or failed')
    }
    conditions.push(eq(schema.socialPosts.status, status))
  }

  const whereCondition = conditions.length ? and(...conditions) : undefined

  const rows = await db.select({
    id: schema.socialPosts.id,
    quote_id: schema.socialPosts.quoteId,
    source_type: schema.socialPosts.sourceType,
    source_id: schema.socialPosts.sourceId,
    queue_id: schema.socialPosts.queueId,
    platform: schema.socialPosts.platform,
    status: schema.socialPosts.status,
    post_text: schema.socialPosts.postText,
    post_url: schema.socialPosts.postUrl,
    external_post_id: schema.socialPosts.externalPostId,
    error_message: schema.socialPosts.errorMessage,
    posted_at: schema.socialPosts.postedAt,
    created_at: schema.socialPosts.createdAt
  })
    .from(schema.socialPosts)
    .where(whereCondition)
    .orderBy(desc(schema.socialPosts.postedAt), desc(schema.socialPosts.id))
    .limit(limit)
    .offset(offset)

  const totalRow = await db
    .select({ total: count() })
    .from(schema.socialPosts)
    .where(whereCondition)

  const total = Number(totalRow[0]?.total || 0)
  const totalPages = Math.ceil(total / limit)

  return {
    posts: rows.map(row => ({
      ...row,
      posted_at: toResponseTimestamp(row.posted_at),
      created_at: toResponseTimestamp(row.created_at)
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  }
}
