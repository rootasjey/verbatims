import { previewReferenceEnrichment } from '~/server/utils/enrichment/processor'
import throwServer from '~/server/utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid reference ID')
  }

  const job = await previewReferenceEnrichment(id, session.user.id)
  if (!job) {
    throwServer(404, 'No enrichment job could be generated for this reference')
  }

  return {
    success: true,
    data: {
      job,
      preview: job.resultPayload ? JSON.parse(job.resultPayload) : null,
    }
  }
})