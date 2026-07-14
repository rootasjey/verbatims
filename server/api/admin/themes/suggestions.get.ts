import { db, schema } from 'hub:db'
import { eq, and, desc, count, inArray } from 'drizzle-orm'

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'theme'
}

function toTitle(text: string): string {
  return text.replace(/\w+/g, w => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = { en: 'English', fr: 'French', es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese', la: 'Latin' }
  return names[code] || code
}

function pick<T>(items: T[], index: number, key: string): T | undefined {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i) | 0
  return items[Math.abs(hash + index * 7) % items.length]
}

const colorPairs = [
  ['indigo', 'amber'],
  ['emerald', 'yellow'],
  ['violet', 'pink'],
  ['blue', 'cyan'],
  ['rose', 'slate'],
  ['teal', 'orange'],
  ['fuchsia', 'lime'],
  ['sky', 'indigo'],
  ['purple', 'emerald'],
  ['amber', 'stone'],
]

const tagPatterns = [
  { name: (s: string) => s, desc: (s: string) => `A curated journey through quotes about ${s}` },
  { name: (s: string) => `Visions of ${s}`, desc: (s: string) => `Exploring the many facets of ${s} through unforgettable words` },
  { name: (s: string) => `The World of ${s}`, desc: (s: string) => `Discover perspectives on ${s} from thinkers and creatives` },
  { name: (s: string) => `Through the Lens of ${s}`, desc: (s: string) => `Seeing ${s} differently — one quote at a time` },
  { name: (s: string) => `Echoes of ${s}`, desc: (s: string) => `Quotes that capture the lasting resonance of ${s}` },
  { name: (s: string) => `Beyond ${s}`, desc: (s: string) => `Thoughts that push the boundaries of ${s}` },
  { name: (s: string) => `Reflections on ${s}`, desc: (s: string) => `Wisdom and musings on the theme of ${s}` },
  { name: (s: string) => `The ${s} Collection`, desc: (s: string) => `A handpicked selection of quotes about ${s}` },
]

const MAX_SUGGESTIONS = 6

interface DateEvent {
  month: number
  day: number
  context: string
  keywords: string
}

const dateEvents: DateEvent[] = [
  { month: 1, day: 1, context: "New Year's Day", keywords: "new beginnings, resolutions, fresh start" },
  { month: 2, day: 14, context: "Valentine's Day", keywords: "love, romance, affection, hearts" },
  { month: 3, day: 8, context: "International Women's Day", keywords: "women, feminism, equality, empowerment" },
  { month: 3, day: 17, context: "St. Patrick's Day", keywords: "ireland, irish, luck, celebration" },
  { month: 4, day: 1, context: "April Fools' Day", keywords: "humor, jokes, laughter, trickery" },
  { month: 4, day: 22, context: "Earth Day", keywords: "environment, nature, ecology, planet" },
  { month: 5, day: 1, context: "Labour Day / International Workers' Day", keywords: "labor, work, workers, solidarity" },
  { month: 5, day: 8, context: "Victory in Europe Day", keywords: "wwii, liberation, peace, europe" },
  { month: 6, day: 21, context: "Summer Solstice", keywords: "summer, solstice, light, warmth" },
  { month: 7, day: 4, context: "US Independence Day", keywords: "independence, freedom, america, revolution" },
  { month: 7, day: 14, context: "Bastille Day — French Revolution", keywords: "french revolution, liberté, égalité, fraternité, france, revolution" },
  { month: 9, day: 21, context: "International Day of Peace", keywords: "peace, harmony, unity, nonviolence" },
  { month: 10, day: 31, context: "Halloween", keywords: "horror, supernatural, mystery, dark, fear" },
  { month: 11, day: 1, context: "All Saints' Day", keywords: "memory, remembrance, saints" },
  { month: 11, day: 11, context: "Armistice Day / Remembrance Day", keywords: "peace, remembrance, veterans, war" },
  { month: 12, day: 21, context: "Winter Solstice", keywords: "winter, solstice, darkness, light" },
  { month: 12, day: 25, context: "Christmas Day", keywords: "christmas, peace, joy, family, giving" },
  { month: 12, day: 31, context: "New Year's Eve", keywords: "celebration, reflection, midnight, new year" },
]

const wikiCache = new Map<string, { data: string[]; expiry: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000

async function fetchWikipediaEvents(month: number, day: number): Promise<string[]> {
  const key = `${month}-${day}`
  const cached = wikiCache.get(key)
  if (cached && Date.now() < cached.expiry) return cached.data

  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`)
    if (!res.ok) return []
    const json: any = await res.json()
    const events = ((json.events || []) as { year: number; text: string }[])
      .slice(0, 5)
      .map(e => `${e.year} – ${e.text.split('. ')[0]}`)
    wikiCache.set(key, { data: events, expiry: Date.now() + CACHE_TTL })
    return events
  } catch {
    return []
  }
}

function getNearbyDateEvents(): { context: string; keywords: string; diff: number }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const result: { context: string; keywords: string; diff: number }[] = []

  for (const de of dateEvents) {
    const d = new Date(today.getFullYear(), de.month - 1, de.day)
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (Math.abs(diff) <= 7) {
      let label = de.context
      if (diff === 0) label = `${de.context} (Today)`
      else if (diff < 0) label = `${de.context} (${Math.abs(diff)} day(s) ago)`
      else label = `${de.context} (in ${diff} day(s))`
      result.push({ context: label, keywords: de.keywords, diff })
    }
  }

  return result.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
}

async function buildContext(event: any): Promise<string> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lines: string[] = []

  const nearEvents: string[] = []
  const keywords = new Set<string>()

  // Wikipedia on-this-day events for today ±1 day
  const wikiPromises: Promise<string[]>[] = []
  for (let offset = -1; offset <= 1; offset++) {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    wikiPromises.push(fetchWikipediaEvents(d.getMonth() + 1, d.getDate()))
  }
  const wikiResults = await Promise.all(wikiPromises)
  const wikiLines = wikiResults.flat().slice(0, 12)
  if (wikiLines.length > 0) {
    nearEvents.push('On this day in history: ' + wikiLines.join('; '))
  }

  for (const de of dateEvents) {
    const d = new Date(today.getFullYear(), de.month - 1, de.day)
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (Math.abs(diff) <= 7) {
      if (diff === 0) nearEvents.push(`Today: ${de.context}`)
      else if (diff < 0) nearEvents.push(`${Math.abs(diff)} day(s) ago: ${de.context}`)
      else nearEvents.push(`In ${diff} day(s): ${de.context}`)
      de.keywords.split(', ').forEach(k => keywords.add(k))
    }
  }

  if (nearEvents.length > 0) {
    lines.push('Notable dates: ' + nearEvents.join('. ') + '.')
  }
  if (keywords.size > 0) {
    lines.push('Suggested theme directions: ' + Array.from(keywords).join(', ') + '.')
  }

  let useLocation = true
  try {
    const setting = await db.select().from(schema.settings).where(eq(schema.settings.key, 'theme_suggestions_use_location')).get()
    useLocation = setting?.value !== '0'
  } catch {}

  const countryCode = useLocation ? (event.headers.get('cf-ipcountry') || '') : ''
  if (countryCode) {
    const names: Record<string, string> = {
      FR: 'France', US: 'the United States', GB: 'the United Kingdom',
      DE: 'Germany', IT: 'Italy', ES: 'Spain', CA: 'Canada', AU: 'Australia',
      JP: 'Japan', BR: 'Brazil', IN: 'India', CH: 'Switzerland',
      BE: 'Belgium', NL: 'Netherlands', PT: 'Portugal',
    }
    const name = names[countryCode] || countryCode
    lines.push(`Location: ${name}. If relevant, suggest themes connected to ${name} or its culture.`)
  }

  return lines.join('\n')
}

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

  // Per-provider overrides from DB
  const providerKey = provider === 'custom' ? 'custom' : provider
  const dbKey = dbSettings[`${providerKey}_api_key`] || ''
  const dbModel = dbSettings[`${providerKey}_model`] || ''
  if (provider === 'custom' && dbSettings.custom_base_url) baseUrl = dbSettings.custom_base_url
  if (dbModel) model = dbModel

  let apiKey = dbKey

  // Fallback to provider-specific env vars
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

async function generateAISuggestions(
  topTags: { name: string; count: number }[],
  topAuthors: { name: string; count: number }[],
  topReferences: { name: string; count: number }[],
  suggestionCount: number,
  context?: string,
  seedTags?: string[]
): Promise<any[] | null> {
  const config = await getAIConfig()
  if (!config) return null

  try {
    const focusSection = seedTags?.length
      ? `Focus topics: ${seedTags.join(', ')}`
      : `Top tags: ${topTags.slice(0, 5).map(t => t.name).join(', ') || 'none'}\nTop authors: ${topAuthors.slice(0, 5).map(a => a.name).join(', ') || 'none'}\nTop references: ${topReferences.slice(0, 5).map(r => r.name).join(', ') || 'none'}`

    const prompt = `You are a creative curator. Generate ${suggestionCount} original theme suggestions for a quote collection app.

${focusSection}
${context ? '\n' + context : ''}

For each suggestion, pick a primary focus (tag, author, or reference) and optionally combine related tags/authors for a richer theme.

Return a JSON object with a "suggestions" key containing an array of objects with these fields:
- type: "tag" | "author" | "reference" (the primary focus)
- name: creative, original theme name (not just the tag name — be imaginative)
- description: a compelling one-sentence description
- color_primary: one of ${colorPairs.map(c => c[0]).join(', ')}
- color_secondary: one of ${colorPairs.map(c => c[1]).join(', ')}
- filters: array of { type: "tag_name" | "author_name" | "reference_name", value: string, match_mode: "any" }

Rules:
- Each suggestion should have 2-4 filters for rich content
- Never combine incompatible filters (e.g., two different author_names)
- Combine related tags with a tag or author for richer themes
- Names must be unique and not just raw tag/author names
- Make the descriptions evocative and specific`

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
        temperature: 0.8,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) {
      console.error('AI API error:', res.status, await res.text().catch(() => ''))
      return null
    }

    const json = await res.json()
    const choices = json.choices
    if (!choices?.length) return null

    const content = choices[0].message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || [])

    return suggestions.slice(0, MAX_SUGGESTIONS).map((s: any, i: number) => {
      const pair = colorPairs[i % colorPairs.length]!
      return {
        type: s.type || 'tag',
        name: s.name || 'Untitled',
        slug: slugify(s.name || 'untitled'),
        description: s.description || '',
        color_primary: s.color_primary || pair[0],
        color_secondary: s.color_secondary || pair[1],
        filters: (s.filters || []).slice(0, 4),
      }
    })
  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const q = getQuery(event)
    const useAI = q.ai === 'true'
    const seedTagsParam = (q.tags as string) || ''
    const seedTags = seedTagsParam ? seedTagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
    const language = (q.language as string) || ''

    const existingRows = await db.select({ slug: schema.themes.slug })
      .from(schema.themes)
      .all()
    const existingSlugs = new Set(existingRows.map(r => r.slug))

    const baseConditions = [eq(schema.quotes.status, 'approved')]
    if (language) baseConditions.push(eq(schema.quotes.language, language as any))
    const quoteFilter = and(...baseConditions)

    let [topTags, topAuthors, topReferences] = await Promise.all([
      db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(quoteFilter)
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(10)
        .all(),

      db.select({
        id: schema.authors.id,
        name: schema.authors.name,
        count: count(schema.quotes.id),
      })
        .from(schema.authors)
        .innerJoin(schema.quotes, eq(schema.authors.id, schema.quotes.authorId))
        .where(quoteFilter)
        .groupBy(schema.authors.id, schema.authors.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(6)
        .all(),

      db.select({
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        count: count(schema.quotes.id),
      })
        .from(schema.quoteReferences)
        .innerJoin(schema.quotes, eq(schema.quoteReferences.id, schema.quotes.referenceId))
        .where(quoteFilter)
        .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(6)
        .all(),
    ])

    if (seedTags.length) {
      const seedTagData = await db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(and(quoteFilter, inArray(schema.tags.name, seedTags)))
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .all()

      if (seedTagData.length) {
        const seedNames = new Set(seedTagData.map(t => t.name.toLowerCase()))
        topTags = [...seedTagData, ...topTags.filter(t => !seedNames.has(t.name.toLowerCase()))]
      }
    }

    if (useAI) {
      let context = await buildContext(event)
      if (language) context += `\n\nLanguage: ${getLanguageName(language)}. Generate theme names and descriptions in ${getLanguageName(language)} and focus on quotes in this language.`
      const aiSuggestions = await generateAISuggestions(topTags, topAuthors, topReferences, MAX_SUGGESTIONS, context, seedTags)
      if (aiSuggestions) return { success: true, data: aiSuggestions }
    }

    const suggestions: any[] = []
    let colorIndex = 0

    const addSuggestion = (type: string, name: string, desc: string, filters: any[]) => {
      if (suggestions.length >= MAX_SUGGESTIONS) return
      const pair = colorPairs[colorIndex % colorPairs.length]!
      colorIndex++
      suggestions.push({ type, name, slug: slugify(name), description: desc, color_primary: pair![0], color_secondary: pair![1], filters })
    }

    const eventPatterns = [
      (s: string) => `Echoes of ${s}`,
      (s: string) => `Reflections on ${s}`,
      (s: string) => `The Spirit of ${s}`,
      (s: string) => `Visions of ${s}`,
    ]

    if (seedTags.length) {
      const seedTagNames = new Set(seedTags)
      for (const tag of topTags) {
        if (suggestions.length >= MAX_SUGGESTIONS) break
        if (!seedTagNames.has(tag.name.toLowerCase())) continue

        const title = toTitle(tag.name)
        const pattern = pick(tagPatterns, colorIndex, tag.name)!
        const name = pattern.name(title)
        if (existingSlugs.has(slugify(name))) continue

        const filters: any[] = [{ type: 'tag_name', value: tag.name, match_mode: 'any' }]
        addSuggestion('tag', name, pattern.desc(title), filters)
      }
    } else {
      const nearbyEvents = getNearbyDateEvents()
      for (const ev of nearbyEvents) {
        if (suggestions.length >= MAX_SUGGESTIONS) break

        const evKeywords = ev.keywords.split(', ')
        const matchingTags = topTags.filter(t =>
          evKeywords.some(kw =>
            t.name.toLowerCase().includes(kw) || kw.includes(t.name.toLowerCase())
          )
        )
        if (!matchingTags.length) continue

        const baseName = ev.context.split(' (')[0] || ev.context
        const name = eventPatterns[colorIndex % eventPatterns.length]!(baseName)
        const desc = `Quotes that capture the spirit of ${baseName.toLowerCase()}`
        const filters = matchingTags.slice(0, 4).map(t => ({ type: 'tag_name' as const, value: t.name, match_mode: 'any' as const }))
        addSuggestion('tag', name, desc, filters)
      }
    }

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error generating theme suggestions:', error)
    throwServer(500, 'Failed to generate theme suggestions')
  }
})
