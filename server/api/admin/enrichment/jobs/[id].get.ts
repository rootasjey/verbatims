import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import throwServer from '~/server/utils/throw-server'

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

  return {
    success: true,
    data: {
      job,
      preview: job.resultPayload ? JSON.parse(job.resultPayload) : null,
    }
  }
})