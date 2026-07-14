export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const { provider, apiKey, model, baseUrl } = await readBody(event) as {
    provider: string
    apiKey: string
    model: string
    baseUrl?: string
  }

  if (!apiKey) throwServer(400, 'API key is required')
  if (!model) throwServer(400, 'Model name is required')

  const baseUrls: Record<string, string> = {
    openrouter: 'https://openrouter.ai/api/v1',
    opencode: 'https://opencode.ai/zen/go/v1',
    openai: 'https://api.openai.com/v1',
  }

  const url = provider === 'custom' ? (baseUrl || '') : (baseUrls[provider] || '')
  if (!url) throwServer(400, 'Provider base URL is required')

  try {
    const res = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with "ok" and nothing else.' }],
        max_tokens: 10,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` }
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Connection failed' }
  }
})
