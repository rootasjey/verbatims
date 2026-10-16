import { getQuoteAuditPilotStatus, runQuoteAuditBatch } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOAuthStatus } from '../../../utils/quote-audit/oauth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const oauth = await getQuoteAuditOAuthStatus()
  if (!oauth.connected) {
    throwServer(409, 'Connect a ChatGPT OAuth session before testing quote audits')
  }
  if (oauth.needsReconnect || !oauth.modelAvailable) {
    throwServer(409, 'Reconnect the ChatGPT session and verify that gpt-6-luna is available before testing')
  }

  const pilot = await getQuoteAuditPilotStatus()
  if (pilot.count > 0) {
    throwServer(409, 'The one-quote production test has already been run')
  }

  const report = await runQuoteAuditBatch(1, true)
  return { success: report.success, data: report }
})
