import { setQuoteAuditOpenRouterKey } from '../../../utils/quote-audit/openrouter'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ apiKey?: unknown }>(event)
  try {
    return { success: true, data: await setQuoteAuditOpenRouterKey(body?.apiKey) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OpenRouter key could not be configured'
    throwServer(message.includes('rejected') || message.includes('valid OpenRouter') ? 400 : 502, message)
  }
})
