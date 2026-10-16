import { setQuoteAuditConfig, type QuoteAuditCadence, type QuoteAuditMode } from '../../../utils/quote-audit/config'
import { getQuoteAuditPilotStatus } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOAuthStatus } from '../../../utils/quote-audit/oauth'

const modes: QuoteAuditMode[] = ['paused', 'pilot', 'continuous']
const cadences: QuoteAuditCadence[] = ['weekdays', 'weekly']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ mode?: unknown, cadence?: unknown }>(event)
  if (!body || !modes.includes(body.mode as QuoteAuditMode) || !cadences.includes(body.cadence as QuoteAuditCadence)) {
    throwServer(400, 'Choose a valid quote audit mode and cadence')
  }

  const mode = body.mode as QuoteAuditMode
  if (mode !== 'paused') {
    const oauth = await getQuoteAuditOAuthStatus()
    if (!oauth.connected) {
      throwServer(409, 'Connect a ChatGPT OAuth session before enabling quote audits')
    }
    if (oauth.needsReconnect || !oauth.modelAvailable) {
      throwServer(409, 'The ChatGPT session must be reconnected and gpt-6-luna must be available before enabling quote audits')
    }
  }
  if (mode === 'continuous') {
    const pilot = await getQuoteAuditPilotStatus()
    if (pilot.count < 20 || pilot.reviewedCount < 20) {
      throwServer(409, 'Complete and review all 20 pilot quotes before continuing with the corpus')
    }
  }

  return {
    success: true,
    data: await setQuoteAuditConfig({
      mode,
      cadence: body.cadence as QuoteAuditCadence,
    }),
  }
})
