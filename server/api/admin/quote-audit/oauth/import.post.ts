import { setQuoteAuditOAuthCredentials } from '../../../../utils/quote-audit/oauth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ credentials?: unknown }>(event)
  if (!body || !body.credentials) throwServer(400, 'A validated ChatGPT OAuth connection is required')

  try {
    return { success: true, data: await setQuoteAuditOAuthCredentials(body.credentials) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ChatGPT OAuth connection could not be stored'
    throw createError({ statusCode: 400, statusMessage: message })
  }
})
