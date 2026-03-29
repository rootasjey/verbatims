import { resolveEnrichmentConfig } from '../../../utils/enrichment/config'
import throwServer from '../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || session.user.role !== 'admin') {
    throwServer(403, 'Admin access required')
  }

  return {
    success: true,
    data: await resolveEnrichmentConfig(),
  }
})