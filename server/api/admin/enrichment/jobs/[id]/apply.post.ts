import { applyEnrichmentJob } from '../../../../../utils/enrichment/processor'
import throwServer from '../../../../../utils/throw-server'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid enrichment job ID')
  }

  const body = await readBody<{ fields?: EnrichmentProposalField[] }>(event)
  const result = await applyEnrichmentJob(id, body?.fields, session.user.id)

  return {
    success: true,
    data: result,
  }
})