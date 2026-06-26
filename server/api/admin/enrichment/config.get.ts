import { resolveEnrichmentConfig } from '../../../utils/enrichment/config'
import throwServer from '../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)

  return {
    success: true,
    data: await resolveEnrichmentConfig(),
  }
})