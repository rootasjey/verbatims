import { db, schema } from 'hub:db'
import { desc, eq } from 'drizzle-orm'
import throwServer from '~~/server/utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid enrichment job ID')
  }

  const job = await db.select()
    .from(schema.entityEnrichmentJobs)
    .where(eq(schema.entityEnrichmentJobs.id, id))
    .get()

  if (!job) {
    throwServer(404, 'Enrichment job not found')
  }

  const [proposals, changeHistory] = await Promise.all([
    db.select()
      .from(schema.entityEnrichmentFieldProposals)
      .where(eq(schema.entityEnrichmentFieldProposals.jobId, id))
      .orderBy(desc(schema.entityEnrichmentFieldProposals.recommended), desc(schema.entityEnrichmentFieldProposals.confidence), desc(schema.entityEnrichmentFieldProposals.id)),
    db.select()
      .from(schema.entityFieldChangeHistory)
      .where(eq(schema.entityFieldChangeHistory.jobId, id))
      .orderBy(desc(schema.entityFieldChangeHistory.createdAt), desc(schema.entityFieldChangeHistory.id)),
  ])

  const entity = job.entityType === 'author'
    ? await db.select({ id: schema.authors.id, name: schema.authors.name })
      .from(schema.authors)
      .where(eq(schema.authors.id, job.entityId))
      .get()
    : await db.select({ id: schema.quoteReferences.id, name: schema.quoteReferences.name })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, job.entityId))
      .get()

  return {
    success: true,
    data: {
      job,
      entity,
      preview: job.resultPayload ? JSON.parse(job.resultPayload) : null,
      proposals: proposals.map((proposal) => ({
        ...proposal,
        sourceLabels: proposal.sourceLabels ? JSON.parse(proposal.sourceLabels) : [],
        sourceUrls: proposal.sourceUrls ? JSON.parse(proposal.sourceUrls) : [],
      })),
      changeHistory,
    }
  }
})