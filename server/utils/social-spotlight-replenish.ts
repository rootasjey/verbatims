import { db, schema } from 'hub:db'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import type { SocialPlatform } from '#shared/constants/social'
import { getEnabledSocialPostingPlatforms } from './social-autopost'

const SPOTLIGHTS_PER_WEEK = 3
const PARIS_SLOTS = [16 * 60 + 8, 16 * 60 + 8, 16 * 60 + 8]
const SLOT_DAYS = [1, 3, 5] // Monday, Wednesday, Friday

function parisDateParts(date: Date) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date)
  return Object.fromEntries(values.map(part => [part.type, part.value])) as Record<string, string>
}

function parisOffsetMinutes(date: Date) {
  const name = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
    .formatToParts(date).find(part => part.type === 'timeZoneName')?.value || 'GMT+1'
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return 60
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0))
}

function getParisSpotlightSlots(now = new Date()) {
  const parts = parisDateParts(now)
  const localDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
  const offset = parisOffsetMinutes(now)
  return SLOT_DAYS.map((day, index) => {
    const date = new Date(localDate)
    const daysAhead = (day - date.getUTCDay() + 7) % 7 || 7
    date.setUTCDate(date.getUTCDate() + daysAhead)
    const minutes = PARIS_SLOTS[index]!
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), Math.floor(minutes / 60), minutes % 60) - offset * 60_000)
  })
}

async function getEligibleSources() {
  const [authors, references] = await Promise.all([
    db.select({ sourceType: sql<string>`'author'`, sourceId: schema.authors.id })
      .from(schema.authors)
      .where(and(sql`${schema.authors.imageUrl} IS NOT NULL`, sql`${schema.authors.imageUrl} != ''`, eq(schema.authors.imageLicenseStatus, 'documented'), sql`${schema.authors.imageCreditStatus} IN ('creator_known', 'source_known')`, sql`NOT EXISTS (
        SELECT 1 FROM ${schema.socialQueue} WHERE ${schema.socialQueue.sourceType} = 'author' AND ${schema.socialQueue.sourceId} = ${schema.authors.id} AND ${schema.socialQueue.contentType} = 'spotlight'
      )`, sql`NOT EXISTS (
        SELECT 1 FROM ${schema.socialPosts} WHERE ${schema.socialPosts.sourceType} = 'author' AND ${schema.socialPosts.sourceId} = ${schema.authors.id} AND ${schema.socialPosts.contentType} = 'spotlight' AND ${schema.socialPosts.status} = 'success'
      )`))
      .orderBy(sql`RANDOM()`, asc(schema.authors.id)).limit(SPOTLIGHTS_PER_WEEK),
    db.select({ sourceType: sql<string>`'reference'`, sourceId: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(and(sql`${schema.quoteReferences.imageUrl} IS NOT NULL`, sql`${schema.quoteReferences.imageUrl} != ''`, eq(schema.quoteReferences.imageLicenseStatus, 'documented'), sql`${schema.quoteReferences.imageCreditStatus} IN ('creator_known', 'source_known')`, sql`NOT EXISTS (
        SELECT 1 FROM ${schema.socialQueue} WHERE ${schema.socialQueue.sourceType} = 'reference' AND ${schema.socialQueue.sourceId} = ${schema.quoteReferences.id} AND ${schema.socialQueue.contentType} = 'spotlight'
      )`, sql`NOT EXISTS (
        SELECT 1 FROM ${schema.socialPosts} WHERE ${schema.socialPosts.sourceType} = 'reference' AND ${schema.socialPosts.sourceId} = ${schema.quoteReferences.id} AND ${schema.socialPosts.contentType} = 'spotlight' AND ${schema.socialPosts.status} = 'success'
      )`))
      .orderBy(sql`RANDOM()`, asc(schema.quoteReferences.id)).limit(SPOTLIGHTS_PER_WEEK)
  ])
  return [...authors, ...references].sort(() => Math.random() - 0.5).slice(0, SPOTLIGHTS_PER_WEEK)
}

export async function replenishSocialSpotlightQueues() {
  const [platforms, sources] = await Promise.all([getEnabledSocialPostingPlatforms(), getEligibleSources()])
  if (!platforms.length || !sources.length) {
    return { success: true, weeklyTarget: SPOTLIGHTS_PER_WEEK, added: 0, results: [] }
  }

  const slots = getParisSpotlightSlots()
  const sourceFilter = or(...sources.map(source => and(
    eq(schema.socialQueue.sourceType, source.sourceType),
    eq(schema.socialQueue.sourceId, source.sourceId)
  )))!

  const [positions, beforeCount] = await Promise.all([
    Promise.all(platforms.map(async (platform) => {
      const maxPosition = await db.select({ value: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)` })
        .from(schema.socialQueue)
        .where(eq(schema.socialQueue.platform, platform)).get()
      return Number(maxPosition?.value || 0)
    })),
    countQueuedSpotlights(sourceFilter, platforms)
  ])

  const statements = platforms.map((platform, platformIndex) => {
    const basePosition = positions[platformIndex]!
    return db.insert(schema.socialQueue).values(sources.map((source, index) => ({
      quoteId: null,
      contentType: 'spotlight' as const,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      platform,
      status: 'queued' as const,
      position: basePosition + index + 1,
      scheduledFor: slots[index]!,
      createdAt: new Date(),
      updatedAt: new Date()
    }))).onConflictDoNothing()
  })
  await db.batch(statements as any)

  const afterCount = await countQueuedSpotlights(sourceFilter, platforms)
  const results = platforms.flatMap(platform => sources.map((source, index) => ({
    platform,
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    scheduledFor: slots[index]!.toISOString()
  })))

  return {
    success: true,
    weeklyTarget: SPOTLIGHTS_PER_WEEK,
    added: Math.max(0, afterCount - beforeCount),
    results
  }
}

async function countQueuedSpotlights(sourceFilter: ReturnType<typeof or>, platforms: SocialPlatform[]) {
  const result = await db.select({ value: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(and(
      eq(schema.socialQueue.contentType, 'spotlight'),
      inArray(schema.socialQueue.platform, platforms),
      sourceFilter
    )).get()
  return Number(result?.value || 0)
}
