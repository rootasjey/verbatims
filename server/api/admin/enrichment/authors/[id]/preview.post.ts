import { previewAuthorEnrichment } from '../../../../../utils/enrichment/processor'
import throwServer from '../../../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const id = Number(getRouterParam(event, 'id')!)
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid author ID')
  }

  const body = await readBody<{ preferredExternalId?: string | null }>(event)

  const job = await previewAuthorEnrichment(id, user.id, body?.preferredExternalId || null)
  if (!job) throwServer(404, 'No enrichment job could be generated for this author')

  return {
    success: true,
    data: {
      job: job!,
      preview: job!.resultPayload ? JSON.parse(job!.resultPayload) : null,
    }
  }
})