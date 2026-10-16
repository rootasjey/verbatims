import { disconnectQuoteAuditOAuth } from '../../../../utils/quote-audit/oauth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { success: true, data: await disconnectQuoteAuditOAuth() }
})
