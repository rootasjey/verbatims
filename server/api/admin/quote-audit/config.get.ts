import { getQuoteAuditConfig } from '../../../utils/quote-audit/config'
import { getQuoteAuditPilotModels, getQuoteAuditPilotStatus } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOpenRouterStatus } from '../../../utils/quote-audit/openrouter'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [config, pilot, pilotModels, provider] = await Promise.all([
    getQuoteAuditConfig(),
    getQuoteAuditPilotStatus(),
    getQuoteAuditPilotModels(),
    getQuoteAuditOpenRouterStatus(),
  ])

  return {
    success: true,
    data: {
      ...config,
      provider,
      pilotCount: pilot.count,
      pilotReviewedCount: pilot.reviewedCount,
      pilotIds: pilot.ids,
      pilotModels,
    },
  }
})
