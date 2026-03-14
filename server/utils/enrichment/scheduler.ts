import { db, schema } from 'hub:db'
import { and, asc, count, desc, eq, inArray, lte, notInArray, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import type { SQL } from 'drizzle-orm'
import type { EnrichmentEntityType, EnrichmentJobReason, EnrichmentTriggerSource } from '#shared/constants/enrichment'
import { ENRICHMENT_ENTITY_TYPES } from '#shared/constants/enrichment'
import { resolveEnrichmentConfig } from './config'

type EntityIdsByType = Partial<Record<EnrichmentEntityType, number[]>>

export interface ScheduleVerificationOptions {
  entityTypes?: EnrichmentEntityType[]
  entityIdsByType?: EntityIdsByType
  limitPerType?: number
  triggeredBy?: EnrichmentTriggerSource
  createdBy?: number | null
  reason?: EnrichmentJobReason
}

export interface VerificationQueueStats {
  jobs: Record<'queued' | 'processing' | 'completed' | 'failed' | 'cancelled', number>
  states: Record<'queued' | 'processing' | 'verified' | 'review' | 'failed', number>
  byEntityType: Record<EnrichmentEntityType, { queued: number, processing: number, due: number }>
  recentJobs: Array<{
    id: number
    jobId: string
    entityType: EnrichmentEntityType
    entityId: number
    status: string
    reason: string
    triggerSource: string
    createdAt: Date | null
    updatedAt: Date | null
  }>
}

interface EnrichmentPolicy {
  batchSize: number
  staleAfterDays: Record<EnrichmentEntityType, number>
  cronEnabled: boolean
}

interface DueCandidate {
  entityId: number
  reason: EnrichmentJobReason
}

const ACTIVE_JOB_STATUSES = ['queued', 'processing'] as const

export async function getEnrichmentPolicy(): Promise<EnrichmentPolicy> {
  const config = await resolveEnrichmentConfig()

  return {
    batchSize: config.values.scheduleBatchSize,
    staleAfterDays: {
      author: config.values.authorStaleDays,
      reference: config.values.referenceStaleDays,
    },
    cronEnabled: config.values.scheduleEnabled,
  }
}

export async function scheduleVerificationJobs(options: ScheduleVerificationOptions = {}) {
  const policy = await getEnrichmentPolicy()
  const entityTypes = normalizeEntityTypes(options.entityTypes)
  const limitPerType = Math.max(1, options.limitPerType || policy.batchSize)
  const triggeredBy = options.triggeredBy || 'manual'
  const createdBy = options.createdBy ?? null
  const reason = options.reason

  const summary: Record<string, { candidates: number, enqueued: number, skipped: number }> = {}
  let totalEnqueued = 0

  for (const entityType of entityTypes) {
    const explicitIds = uniqueIds(options.entityIdsByType?.[entityType] || [])
    const candidates = explicitIds.length > 0
      ? explicitIds.map(entityId => ({ entityId, reason: reason || 'manual' }))
      : await findDueCandidates(entityType, limitPerType, policy)

    const enqueueResult = await enqueueCandidates(entityType, candidates, triggeredBy, createdBy)
    totalEnqueued += enqueueResult.enqueued

    summary[entityType] = {
      candidates: candidates.length,
      enqueued: enqueueResult.enqueued,
      skipped: candidates.length - enqueueResult.enqueued,
    }
  }

  return {
    success: true,
    triggeredBy,
    totalEnqueued,
    policy,
    summary,
  }
}

export async function getVerificationQueueStats(limit = 20): Promise<VerificationQueueStats> {
  const safeLimit = Math.max(1, Math.min(limit, 100))

  const [jobCounts, stateCounts, byTypeRows, recentJobs] = await Promise.all([
    db.select({
      status: schema.entityEnrichmentJobs.status,
      total: count(),
    })
      .from(schema.entityEnrichmentJobs)
      .groupBy(schema.entityEnrichmentJobs.status),
    db.select({
      status: schema.entityVerificationState.verificationStatus,
      total: count(),
    })
      .from(schema.entityVerificationState)
      .groupBy(schema.entityVerificationState.verificationStatus),
    getByEntityTypeStats(),
    db.select({
      id: schema.entityEnrichmentJobs.id,
      jobId: schema.entityEnrichmentJobs.jobId,
      entityType: schema.entityEnrichmentJobs.entityType,
      entityId: schema.entityEnrichmentJobs.entityId,
      status: schema.entityEnrichmentJobs.status,
      reason: schema.entityEnrichmentJobs.reason,
      triggerSource: schema.entityEnrichmentJobs.triggerSource,
      createdAt: schema.entityEnrichmentJobs.createdAt,
      updatedAt: schema.entityEnrichmentJobs.updatedAt,
    })
      .from(schema.entityEnrichmentJobs)
      .orderBy(desc(schema.entityEnrichmentJobs.createdAt), desc(schema.entityEnrichmentJobs.id))
      .limit(safeLimit),
  ])

  const jobs = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  }

  for (const row of jobCounts) {
    if (row.status in jobs) {
      jobs[row.status as keyof typeof jobs] = Number(row.total || 0)
    }
  }

  const states = {
    queued: 0,
    processing: 0,
    verified: 0,
    review: 0,
    failed: 0,
  }

  for (const row of stateCounts) {
    if (row.status in states) {
      states[row.status as keyof typeof states] = Number(row.total || 0)
    }
  }

  const byEntityType = {
    author: { queued: 0, processing: 0, due: 0 },
    reference: { queued: 0, processing: 0, due: 0 },
  }

  for (const row of byTypeRows) {
    byEntityType[row.entityType].queued = Number(row.queued || 0)
    byEntityType[row.entityType].processing = Number(row.processing || 0)
    byEntityType[row.entityType].due = Number(row.due || 0)
  }

  return {
    jobs,
    states,
    byEntityType,
    recentJobs: recentJobs as VerificationQueueStats['recentJobs'],
  }
}

async function getByEntityTypeStats() {
  const now = new Date()
  const authorState = alias(schema.entityVerificationState, 'author_state')
  const referenceState = alias(schema.entityVerificationState, 'reference_state')

  const [authorQueued, authorProcessing, authorDue, referenceQueued, referenceProcessing, referenceDue] = await Promise.all([
    getEntityTypeJobCount('author', 'queued'),
    getEntityTypeJobCount('author', 'processing'),
    getEntityTypeDueCount('author', authorState, now),
    getEntityTypeJobCount('reference', 'queued'),
    getEntityTypeJobCount('reference', 'processing'),
    getEntityTypeDueCount('reference', referenceState, now),
  ])

  return [
    { entityType: 'author' as const, queued: authorQueued, processing: authorProcessing, due: authorDue },
    { entityType: 'reference' as const, queued: referenceQueued, processing: referenceProcessing, due: referenceDue },
  ]
}

async function getEntityTypeJobCount(entityType: EnrichmentEntityType, status: 'queued' | 'processing') {
  const rows = await db.select({ total: count() })
    .from(schema.entityEnrichmentJobs)
    .where(and(
      eq(schema.entityEnrichmentJobs.entityType, entityType),
      eq(schema.entityEnrichmentJobs.status, status),
    ))

  return Number(rows[0]?.total || 0)
}

async function getEntityTypeDueCount(
  entityType: EnrichmentEntityType,
  stateAlias: typeof schema.entityVerificationState,
  now: Date,
) {
  const dueConditions = buildDueCondition(entityType, stateAlias, now)

  if (entityType === 'author') {
    const rows = await db.select({ total: count() })
      .from(schema.authors)
      .leftJoin(stateAlias, and(
        eq(stateAlias.entityType, 'author'),
        eq(stateAlias.entityId, schema.authors.id),
      ))
      .where(dueConditions)

    return Number(rows[0]?.total || 0)
  }

  const rows = await db.select({ total: count() })
    .from(schema.quoteReferences)
    .leftJoin(stateAlias, and(
      eq(stateAlias.entityType, 'reference'),
      eq(stateAlias.entityId, schema.quoteReferences.id),
    ))
    .where(dueConditions)

  return Number(rows[0]?.total || 0)
}

async function findDueCandidates(
  entityType: EnrichmentEntityType,
  limit: number,
  policy: EnrichmentPolicy,
): Promise<DueCandidate[]> {
  const now = new Date()
  const stateAlias = alias(schema.entityVerificationState, `${entityType}_verification_state`)
  const staleCutoff = new Date(now.getTime() - (policy.staleAfterDays[entityType] * 24 * 60 * 60 * 1000))
  const dueConditions = buildDueCondition(entityType, stateAlias, now)

  const activeEntityIds = await getActiveEntityJobIds(entityType)

  const orderColumns = [
    asc(sql`CASE WHEN ${stateAlias.id} IS NULL THEN 0 ELSE 1 END`),
    asc(stateAlias.nextCheckAt),
  ]

  const rows = entityType === 'author'
    ? await db.select({
      entityId: schema.authors.id,
      lastVerifiedAt: stateAlias.lastVerifiedAt,
    })
      .from(schema.authors)
      .leftJoin(stateAlias, and(
        eq(stateAlias.entityType, 'author'),
        eq(stateAlias.entityId, schema.authors.id),
      ))
      .where(and(
        dueConditions,
        activeEntityIds.length > 0 ? notInArray(schema.authors.id, activeEntityIds) : undefined,
      ))
      .orderBy(...orderColumns, desc(schema.authors.updatedAt), asc(schema.authors.id))
      .limit(limit)
    : await db.select({
      entityId: schema.quoteReferences.id,
      lastVerifiedAt: stateAlias.lastVerifiedAt,
    })
      .from(schema.quoteReferences)
      .leftJoin(stateAlias, and(
        eq(stateAlias.entityType, 'reference'),
        eq(stateAlias.entityId, schema.quoteReferences.id),
      ))
      .where(and(
        dueConditions,
        activeEntityIds.length > 0 ? notInArray(schema.quoteReferences.id, activeEntityIds) : undefined,
      ))
      .orderBy(...orderColumns, desc(schema.quoteReferences.updatedAt), asc(schema.quoteReferences.id))
      .limit(limit)

  return rows.map((row) => ({
    entityId: row.entityId,
    reason: !row.lastVerifiedAt
      ? 'never_verified'
      : row.lastVerifiedAt <= staleCutoff
        ? 'stale'
        : 'retry',
  }))
}

async function enqueueCandidates(
  entityType: EnrichmentEntityType,
  candidates: DueCandidate[],
  triggeredBy: EnrichmentTriggerSource,
  createdBy: number | null,
) {
  const uniqueCandidates = dedupeCandidates(candidates)

  if (uniqueCandidates.length === 0) {
    return { enqueued: 0 }
  }

  const activeIds = await getActiveEntityJobIds(entityType, uniqueCandidates.map(candidate => candidate.entityId))
  const candidatesToEnqueue = uniqueCandidates.filter(candidate => !activeIds.includes(candidate.entityId))
  const now = new Date()

  for (const candidate of candidatesToEnqueue) {
    const payload = JSON.stringify({ entityType, entityId: candidate.entityId, reason: candidate.reason })

    await db.insert(schema.entityEnrichmentJobs)
      .values({
        jobId: crypto.randomUUID(),
        entityType,
        entityId: candidate.entityId,
        reason: candidate.reason,
        status: 'queued',
        triggerSource: triggeredBy,
        priority: candidate.reason === 'manual' ? 100 : candidate.reason === 'never_verified' ? 80 : 50,
        scheduledFor: now,
        createdBy,
        payload,
        updatedAt: now,
      })
      .run()

    await db.insert(schema.entityVerificationState)
      .values({
        entityType,
        entityId: candidate.entityId,
        verificationStatus: 'queued',
        lastEnqueuedAt: now,
        reviewRequired: false,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [schema.entityVerificationState.entityType, schema.entityVerificationState.entityId],
        set: {
          verificationStatus: 'queued',
          lastEnqueuedAt: now,
          updatedAt: now,
        }
      })
      .run()
  }

  return { enqueued: candidatesToEnqueue.length }
}

async function getActiveEntityJobIds(entityType: EnrichmentEntityType, ids?: number[]) {
  const filters = [
    eq(schema.entityEnrichmentJobs.entityType, entityType),
    inArray(schema.entityEnrichmentJobs.status, [...ACTIVE_JOB_STATUSES]),
  ] as SQL<unknown>[]

  if (ids && ids.length > 0) {
    filters.push(inArray(schema.entityEnrichmentJobs.entityId, ids))
  }

  const rows = await db.select({ entityId: schema.entityEnrichmentJobs.entityId })
    .from(schema.entityEnrichmentJobs)
    .where(and(...filters))
    .groupBy(schema.entityEnrichmentJobs.entityId)

  return rows.map(row => row.entityId)
}

function buildDueCondition(
  entityType: EnrichmentEntityType,
  stateAlias: typeof schema.entityVerificationState,
  now: Date,
) {
  return or(
    sql`${stateAlias.id} IS NULL`,
    sql`${stateAlias.lastVerifiedAt} IS NULL`,
    lte(stateAlias.nextCheckAt, now),
    and(
      eq(stateAlias.entityType, entityType),
      eq(stateAlias.verificationStatus, 'failed'),
    ),
  )
}

function normalizeEntityTypes(entityTypes?: EnrichmentEntityType[]) {
  const next = entityTypes && entityTypes.length > 0 ? entityTypes : [...ENRICHMENT_ENTITY_TYPES]
  return Array.from(new Set(next))
}

function uniqueIds(values: number[]) {
  return Array.from(new Set(values.filter(value => Number.isInteger(value) && value > 0)))
}

function dedupeCandidates(candidates: DueCandidate[]) {
  const map = new Map<number, DueCandidate>()

  for (const candidate of candidates) {
    if (!map.has(candidate.entityId)) {
      map.set(candidate.entityId, candidate)
    }
  }

  return Array.from(map.values())
}
