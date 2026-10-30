import { db, schema } from 'hub:db'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import type { SocialPlatform } from '#shared/constants/social'
import {
  resolveBlueskyProviderConfig,
  resolveFacebookEnabledConfig,
  resolveInstagramEnabledConfig,
  resolveThreadsEnabledConfig
} from './social-provider-config'
import {
  getSocialQueueAutofillConfig,
  recordSocialQueueAutofillRun,
  type SocialQueueAutofillOutcome,
  type SocialQueueAutofillPlatformRun
} from './social-queue-autofill-config'

const INSERT_BATCH_SIZE = 10
const AUTO_QUEUE_PLATFORMS: readonly SocialPlatform[] = ['bluesky', 'threads', 'facebook', 'instagram']

export async function getEnabledSocialAutofillPlatforms(): Promise<SocialPlatform[]> {
  const [bluesky, threads, facebook, instagram] = await Promise.all([
    resolveBlueskyProviderConfig(),
    resolveThreadsEnabledConfig(),
    resolveFacebookEnabledConfig(),
    resolveInstagramEnabledConfig()
  ])

  const enabled = new Set<SocialPlatform>()
  if (bluesky.enabled) enabled.add('bluesky')
  if (threads.enabled) enabled.add('threads')
  if (facebook.enabled) enabled.add('facebook')
  if (instagram.enabled) enabled.add('instagram')

  return AUTO_QUEUE_PLATFORMS.filter(platform => enabled.has(platform))
}

interface PlatformReplenishmentResult extends SocialQueueAutofillPlatformRun {
  platform: SocialPlatform
}

async function getQueueCounts() {
  const rows = await db.select({
    platform: schema.socialQueue.platform,
    contentType: schema.socialQueue.contentType,
    status: schema.socialQueue.status,
    total: sql<number>`COUNT(*)`
  })
    .from(schema.socialQueue)
    .groupBy(schema.socialQueue.platform, schema.socialQueue.status)

  const counts = new Map<SocialPlatform, number>()
  for (const row of rows) {
    if (!AUTO_QUEUE_PLATFORMS.includes(row.platform as SocialPlatform)) continue
    if (row.contentType !== 'quote') continue
    if (row.status !== 'queued' && row.status !== 'processing') continue
    counts.set(row.platform as SocialPlatform, (counts.get(row.platform as SocialPlatform) || 0) + Number(row.total || 0))
  }

  return counts
}

export async function getSocialQueueAutofillOverview() {
  const [config, enabledPlatforms, queueCounts] = await Promise.all([
    getSocialQueueAutofillConfig(),
    getEnabledSocialAutofillPlatforms(),
    getQueueCounts()
  ])
  const enabled = new Set(enabledPlatforms)

  return {
    target: config.target,
    lowWatermark: config.lowWatermark,
    updatedAt: config.updatedAt,
    lastRunAt: config.lastRunAt,
    platforms: AUTO_QUEUE_PLATFORMS.map(platform => ({
      platform,
      enabled: enabled.has(platform),
      queued: queueCounts.get(platform) || 0,
      lastRun: config.lastRunByPlatform[platform] || null
    }))
  }
}

async function replenishPlatform(platform: SocialPlatform, target: number, lowWatermark: number): Promise<PlatformReplenishmentResult> {
  const queueCount = await db.select({
    total: sql<number>`COUNT(*)`
  })
    .from(schema.socialQueue)
    .where(and(
      eq(schema.socialQueue.platform, platform),
      eq(schema.socialQueue.contentType, 'quote'),
      inArray(schema.socialQueue.status, ['queued', 'processing'])
    ))
    .get()

  const currentCount = Number(queueCount?.total || 0)
  if (currentCount >= lowWatermark) {
    return {
      platform,
      queuedBefore: currentCount,
      queuedAfter: currentCount,
      added: 0,
      outcome: 'above-threshold'
    }
  }

  const needed = target - currentCount
  const candidates = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(and(
      eq(schema.quotes.status, 'approved'),
      sql`NOT EXISTS (
        SELECT 1 FROM ${schema.socialQueue}
        WHERE ${schema.socialQueue.platform} = ${platform}
          AND ${schema.socialQueue.contentType} = 'quote'
          AND ${schema.socialQueue.sourceType} = 'quote'
          AND ${schema.socialQueue.sourceId} = ${schema.quotes.id}
          AND ${schema.socialQueue.status} IN ('queued', 'processing', 'posted')
      )`,
      sql`NOT EXISTS (
        SELECT 1 FROM ${schema.socialPosts}
        WHERE ${schema.socialPosts.platform} = ${platform}
          AND ${schema.socialPosts.sourceType} = 'quote'
          AND ${schema.socialPosts.sourceId} = ${schema.quotes.id}
          AND ${schema.socialPosts.status} = 'success'
      )`
    ))
    .orderBy(sql`RANDOM()`, asc(schema.quotes.id))
    .limit(needed)

  if (!candidates.length) {
    return {
      platform,
      queuedBefore: currentCount,
      queuedAfter: currentCount,
      added: 0,
      outcome: 'no-quotes'
    }
  }

  const maxPosition = await db.select({
    value: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
  })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform))
    .get()

  const basePosition = Number(maxPosition?.value || 0)
  const now = new Date()
  let added = 0

  for (let offset = 0; offset < candidates.length; offset += INSERT_BATCH_SIZE) {
    const batch = candidates.slice(offset, offset + INSERT_BATCH_SIZE)
    const rows = batch.map((quote, index) => ({
      quoteId: quote.id,
      contentType: 'quote' as const,
      sourceType: 'quote',
      sourceId: quote.id,
      platform,
      status: 'queued' as const,
      position: basePosition + offset + index + 1,
      createdAt: now,
      updatedAt: now
    }))

    const inserted = await db.insert(schema.socialQueue).values(rows).returning({ id: schema.socialQueue.id })
    added += inserted.length
  }

  return {
    platform,
    queuedBefore: currentCount,
    queuedAfter: currentCount + added,
    added,
    outcome: added < needed ? 'partial' : 'refilled'
  }
}

/** Top up enabled, supported social queues when fewer than ten posts remain. */
export async function replenishSocialQueues() {
  const config = await getSocialQueueAutofillConfig()
  const platforms = await getEnabledSocialAutofillPlatforms()
  const results: PlatformReplenishmentResult[] = []
  const errors: Array<{ platform: SocialPlatform, error: unknown }> = []
  const ranAt = new Date().toISOString()

  for (const platform of platforms) {
    try {
      results.push(await replenishPlatform(platform, config.target, config.lowWatermark))
    } catch (error) {
      errors.push({ platform, error })
      console.error(`[social:replenish] Failed to replenish ${platform}`, error)
      results.push({
        platform,
        queuedBefore: 0,
        queuedAfter: 0,
        added: 0,
        outcome: 'error'
      })
    }
  }

  for (const result of results) {
    if (result.added > 0) {
      console.info(`[social:replenish] Added ${result.added} quote(s) to ${result.platform}; queue had ${result.queuedBefore}`)
    } else if (result.outcome === 'no-quotes') {
      console.warn(`[social:replenish] No eligible approved quotes available for ${result.platform}; queue has ${result.queuedBefore}`)
    }
  }

  const lastRunByPlatform: Partial<Record<SocialPlatform, SocialQueueAutofillPlatformRun>> = {}
  for (const result of results) {
    lastRunByPlatform[result.platform] = {
      queuedBefore: result.queuedBefore,
      queuedAfter: result.queuedAfter,
      added: result.added,
      outcome: result.outcome as SocialQueueAutofillOutcome
    }
  }
  await recordSocialQueueAutofillRun({ ranAt, platforms: lastRunByPlatform })

  if (errors.length) {
    throw new Error(`Failed to replenish ${errors.length} social queue(s): ${errors.map(item => item.platform).join(', ')}`)
  }

  return { success: true, target: config.target, lowWatermark: config.lowWatermark, results }
}
