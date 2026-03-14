import { getVerificationQueueStats } from '~~/server/utils/enrichment/scheduler'
import { isEnrichmentJobStatus } from '#shared/constants/enrichment'
import { db, schema } from 'hub:db'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import throwServer from '~~/server/utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.max(1, Math.min(Number.parseInt(String(query.limit || '20'), 10) || 20, 100))
  const offset = (page - 1) * limit
  const status = String(query.status || '').trim()
  const entityType = String(query.entityType || '').trim()
  const entityId = Number.parseInt(String(query.entityId || ''), 10)

  if (status && !isEnrichmentJobStatus(status)) {
    throwServer(400, 'status must be queued, processing, completed, failed, or cancelled')
  }

  if (entityType && entityType !== 'author' && entityType !== 'reference') {
    throwServer(400, 'entityType must be author or reference')
  }

  if (String(query.entityId || '').trim() && (!Number.isInteger(entityId) || entityId <= 0)) {
    throwServer(400, 'entityId must be a positive integer')
  }

  const stats = await getVerificationQueueStats(limit)

  const filters = []
  if (status) filters.push(eq(schema.entityEnrichmentJobs.status, status))
  if (entityType) filters.push(eq(schema.entityEnrichmentJobs.entityType, entityType as 'author' | 'reference'))
  if (Number.isInteger(entityId) && entityId > 0) filters.push(eq(schema.entityEnrichmentJobs.entityId, entityId))

  const totalRows = await db.select({ total: count() })
    .from(schema.entityEnrichmentJobs)
    .where(filters.length > 0 ? and(...filters) : undefined)

  const jobs = await db.select({
    id: schema.entityEnrichmentJobs.id,
    jobId: schema.entityEnrichmentJobs.jobId,
    entityType: schema.entityEnrichmentJobs.entityType,
    entityId: schema.entityEnrichmentJobs.entityId,
    reason: schema.entityEnrichmentJobs.reason,
    status: schema.entityEnrichmentJobs.status,
    triggerSource: schema.entityEnrichmentJobs.triggerSource,
    priority: schema.entityEnrichmentJobs.priority,
    attemptCount: schema.entityEnrichmentJobs.attemptCount,
    scheduledFor: schema.entityEnrichmentJobs.scheduledFor,
    createdAt: schema.entityEnrichmentJobs.createdAt,
    updatedAt: schema.entityEnrichmentJobs.updatedAt,
    appliedAt: schema.entityEnrichmentJobs.appliedAt,
    resultSummary: schema.entityEnrichmentJobs.resultSummary,
    errorMessage: schema.entityEnrichmentJobs.errorMessage,
  })
    .from(schema.entityEnrichmentJobs)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(schema.entityEnrichmentJobs.createdAt), desc(schema.entityEnrichmentJobs.id))
    .limit(limit)
    .offset(offset)

  const authorIds = jobs.filter(job => job.entityType === 'author').map(job => job.entityId)
  const referenceIds = jobs.filter(job => job.entityType === 'reference').map(job => job.entityId)

  const [authors, references] = await Promise.all([
    authorIds.length > 0
      ? db.select({ id: schema.authors.id, name: schema.authors.name })
        .from(schema.authors)
        .where(inArray(schema.authors.id, authorIds))
      : Promise.resolve([]),
    referenceIds.length > 0
      ? db.select({ id: schema.quoteReferences.id, name: schema.quoteReferences.name })
        .from(schema.quoteReferences)
        .where(inArray(schema.quoteReferences.id, referenceIds))
      : Promise.resolve([]),
  ])

  const authorNameMap = new Map(authors.map(author => [author.id, author.name]))
  const referenceNameMap = new Map(references.map(reference => [reference.id, reference.name]))
  const total = Number(totalRows[0]?.total || 0)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    success: true,
    data: {
      stats,
      jobs: jobs.map((job) => ({
        ...job,
        entityName: job.entityType === 'author'
          ? authorNameMap.get(job.entityId) || `Author #${job.entityId}`
          : referenceNameMap.get(job.entityId) || `Reference #${job.entityId}`,
      })),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
})