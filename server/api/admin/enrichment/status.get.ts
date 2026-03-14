import { getVerificationQueueStats } from '~/server/utils/enrichment/scheduler'
import { isEnrichmentJobStatus } from '#shared/constants/enrichment'
import { db, schema } from 'hub:db'
import { and, desc, eq } from 'drizzle-orm'
import throwServer from '~/server/utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const query = getQuery(event)
  const limit = Math.max(1, Math.min(Number.parseInt(String(query.limit || '20'), 10) || 20, 100))
  const status = String(query.status || '').trim()
  const entityType = String(query.entityType || '').trim()

  if (status && !isEnrichmentJobStatus(status)) {
    throwServer(400, 'status must be queued, processing, completed, failed, or cancelled')
  }

  if (entityType && entityType !== 'author' && entityType !== 'reference') {
    throwServer(400, 'entityType must be author or reference')
  }

  const stats = await getVerificationQueueStats(limit)

  const filters = []
  if (status) filters.push(eq(schema.entityEnrichmentJobs.status, status))
  if (entityType) filters.push(eq(schema.entityEnrichmentJobs.entityType, entityType as 'author' | 'reference'))

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
    errorMessage: schema.entityEnrichmentJobs.errorMessage,
  })
    .from(schema.entityEnrichmentJobs)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(schema.entityEnrichmentJobs.createdAt), desc(schema.entityEnrichmentJobs.id))
    .limit(limit)

  return {
    success: true,
    data: {
      stats,
      jobs,
    }
  }
})