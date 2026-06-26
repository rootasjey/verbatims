import { applyEnrichmentJob } from "~~/server/utils/enrichment/processor"

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throwServer(400, 'Invalid enrichment job ID')
  }

  const body = await readBody<{ fields?: EnrichmentProposalField[] }>(event)
  const result = await applyEnrichmentJob(id, body?.fields, user.id)

  return {
    success: true,
    data: result,
  }
})