import { getQuoteAuditConfig } from '../../../utils/quote-audit/config'
import { getQuoteAuditPilotModels, getQuoteAuditPilotStatus } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOpenRouterStatus, getQuoteAuditTestModels } from '../../../utils/quote-audit/openrouter'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [config, pilot, pilotModels, provider, testModels] = await Promise.all([
    getQuoteAuditConfig(),
    getQuoteAuditPilotStatus(),
    getQuoteAuditPilotModels(),
    getQuoteAuditOpenRouterStatus(),
    getQuoteAuditTestModels(),
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
      testModels,
    },
  }
})
