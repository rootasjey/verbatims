import { getQuoteAuditConfig } from '../../../utils/quote-audit/config'
import { getQuoteAuditPilotStatus } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOAuthStatus } from '../../../utils/quote-audit/oauth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [config, pilot, oauth] = await Promise.all([
    getQuoteAuditConfig(),
    getQuoteAuditPilotStatus(),
    getQuoteAuditOAuthStatus(),
  ])

  return {
    success: true,
    data: {
      ...config,
      oauthTokenConfigured: oauth.connected,
      oauth,
      pilotCount: pilot.count,
      pilotReviewedCount: pilot.reviewedCount,
      pilotIds: pilot.ids,
    },
  }
})
