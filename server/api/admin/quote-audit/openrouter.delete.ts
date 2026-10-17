import { deleteQuoteAuditOpenRouterKey } from '../../../utils/quote-audit/openrouter'
import { getQuoteAuditConfig, setQuoteAuditConfig } from '../../../utils/quote-audit/config'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const config = await getQuoteAuditConfig()
  await setQuoteAuditConfig({ mode: 'paused', cadence: config.cadence })
  return { success: true, data: await deleteQuoteAuditOpenRouterKey() }
})
