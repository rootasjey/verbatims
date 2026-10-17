import { getQuoteAuditPilotModels, runQuoteAuditBatch } from '../../../utils/quote-audit/runner'
import { getQuoteAuditOpenRouterStatus, getQuoteAuditTestModels } from '../../../utils/quote-audit/openrouter'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ model?: unknown }>(event)
  const availableModels = await getQuoteAuditTestModels()
  const model = typeof body?.model === 'string' && availableModels.some(option => option.id === body.model) ? body.model : null
  if (!model) throwServer(400, 'Choose a supported quote audit test model')

  const provider = await getQuoteAuditOpenRouterStatus(model)
  if (!provider.valid || !provider.modelAvailable) {
    throwServer(409, 'Configure and validate an OpenRouter API key before testing quote audits')
  }

  const pilotModels = await getQuoteAuditPilotModels()
  if (pilotModels.includes(model)) {
    throwServer(409, 'A one-quote pilot test has already been run with this model')
  }

  const report = await runQuoteAuditBatch(1, true, model)
  return { success: report.success, data: report }
})
