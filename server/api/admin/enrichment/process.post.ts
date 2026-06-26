import { processEnrichmentJobs } from '../../../utils/enrichment/processor'
import throwServer from '../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const body = await readBody<{ limit?: number }>(event)
  const result = await processEnrichmentJobs({
    limit: Number.isInteger(Number(body?.limit)) ? Number(body?.limit) : 3,
  })

  return {
    success: true,
    data: result,
  }
})