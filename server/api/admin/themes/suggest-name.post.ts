import { db, schema } from 'hub:db'

const providerDefaults: Record<string, { baseUrl: string; defaultModel: string }> = {
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
  opencode: { baseUrl: 'https://opencode.ai/zen/go/v1', defaultModel: 'gpt-4o-mini' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  custom: { baseUrl: '', defaultModel: '' },
}

async function getAIConfig(): Promise<{ baseUrl: string; apiKey: string; model: string } | null> {
  let provider = 'openrouter'
  const dbSettings: Record<string, string> = {}
  try {
    const rows = await db.select().from(schema.settings).all()
    for (const r of rows) dbSettings[r.key] = r.value
    if (dbSettings.ai_provider) provider = dbSettings.ai_provider
  } catch {}

  const defaults = providerDefaults[provider] || providerDefaults.openrouter
  let baseUrl = defaults!.baseUrl || process.env.AI_BASE_URL || providerDefaults.openrouter!.baseUrl
  let model = defaults!.defaultModel || process.env.AI_MODEL || providerDefaults.openrouter!.defaultModel

  const providerKey = provider === 'custom' ? 'custom' : provider
  const dbKey = dbSettings[`${providerKey}_api_key`] || ''
  const dbModel = dbSettings[`${providerKey}_model`] || ''
  if (provider === 'custom' && dbSettings.custom_base_url) baseUrl = dbSettings.custom_base_url
  if (dbModel) model = dbModel

  let apiKey = dbKey
  if (!apiKey) {
    const envMap: Record<string, string> = {
      openrouter: process.env.OPENROUTER_API_KEY || '',
      opencode: process.env.OPENCODE_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
    }
    apiKey = envMap[provider] || process.env.AI_API_KEY || ''
  }

  if (!apiKey) return null
  return { baseUrl, apiKey, model }
}

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const body = await readBody(event)
  const input = (body?.name || '').trim()
  if (!input || input.length < 3) {
    throwServer(400, 'Name must be at least 3 characters')
  }

  const config = await getAIConfig()
  if (!config) {
    throwServer(400, 'AI is not configured — set up an AI provider in the AI Suggestions Settings')
  }

  try {
    const prompt = `You are a creative curator. Based on the following topic, generate ONE original, imaginative theme name for a quote collection.

Topic: "${input}"

Return a JSON object with:
- name: a catchy, original theme name (not just the topic — be creative)
- slug: a URL-friendly version of the name (lowercase, hyphens)
- description: a one-sentence description of what the theme covers

Example:
{"name": "Visions of Tomorrow", "slug": "visions-of-tomorrow", "description": "Exploring the future through the words of visionaries and dreamers"}

Only return the JSON object, no other text.`

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300,
      }),
    })

    if (!res.ok) {
      console.error('AI API error:', res.status, await res.text().catch(() => ''))
      throwServer(502, 'AI API request failed')
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content) throwServer(502, 'Empty AI response')

    const parsed = JSON.parse(content)
    const result = {
      name: parsed.name || '',
      slug: parsed.slug || '',
      description: parsed.description || '',
    }

    if (!result.name) throwServer(502, 'AI returned no name')

    return { success: true, data: result }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error suggesting name:', error)
    throwServer(500, 'Failed to generate name suggestion')
  }
})
