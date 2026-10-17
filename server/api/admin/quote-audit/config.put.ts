import { setQuoteAuditConfig, type QuoteAuditCadence, type QuoteAuditMode } from '../../../utils/quote-audit/config'
import { getQuoteAuditPilotStatus } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOpenRouterStatus } from '../../../utils/quote-audit/openrouter'

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
    const provider = await getQuoteAuditOpenRouterStatus()
    if (!provider.valid || !provider.modelAvailable) {
      throwServer(409, 'Configure and validate an OpenRouter API key before enabling quote audits')
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
