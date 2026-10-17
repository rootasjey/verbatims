import { getQuoteAuditPilotStatus, runQuoteAuditBatch } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOpenRouterStatus } from '../../../utils/quote-audit/openrouter'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const provider = await getQuoteAuditOpenRouterStatus()
  if (!provider.valid || !provider.modelAvailable) {
    throwServer(409, 'Configure and validate an OpenRouter API key before testing quote audits')
  }

  const pilot = await getQuoteAuditPilotStatus()
  if (pilot.count > 0) {
    throwServer(409, 'The one-quote production test has already been run')
  }

  const report = await runQuoteAuditBatch(1, true)
  return { success: report.success, data: report }
})
