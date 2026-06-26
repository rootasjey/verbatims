import { previewReferenceEnrichment } from '../../../../../utils/enrichment/processor'
import throwServer from '../../../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const id = Number(getRouterParam(event, 'id')!)
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid reference ID')
  }

  const body = await readBody<{ preferredExternalId?: string | null }>(event)

  const job = await previewReferenceEnrichment(id, user.id, body?.preferredExternalId || null)
  if (!job) throwServer(404, 'No enrichment job could be generated for this reference')

  return {
    success: true,
    data: {
      job: job!,
      preview: job!.resultPayload ? JSON.parse(job!.resultPayload) : null,
    }
  }
})