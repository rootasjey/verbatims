import { previewAuthorEnrichment } from '../../../../../utils/enrichment/processor'
import throwServer from '../../../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid author ID')
  }

  const body = await readBody<{ preferredExternalId?: string | null }>(event)

  const job = await previewAuthorEnrichment(id, session.user.id, body?.preferredExternalId || null)
  if (!job) {
    throwServer(404, 'No enrichment job could be generated for this author')
  }

  return {
    success: true,
    data: {
      job,
      preview: job.resultPayload ? JSON.parse(job.resultPayload) : null,
    }
  }
})