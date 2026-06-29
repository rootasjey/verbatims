import { db, schema } from 'hub:db'
import { eq, and, ne, desc, count, inArray } from 'drizzle-orm'

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

const authorPatterns = [
  { name: (s: string) => `In the Words of ${s}`, desc: (s: string) => `The most memorable quotes by ${s}, collected in one place` },
  { name: (s: string) => s, desc: (s: string) => `A celebration of the wit, wisdom, and words of ${s}` },
  { name: (s: string) => `The World According to ${s}`, desc: (s: string) => `Exploring ${s}'s unique perspective through their quotes` },
  { name: (s: string) => `Voices of ${s}`, desc: (s: string) => `The most striking and insightful quotes from ${s}` },
  { name: (s: string) => `Reflections by ${s}`, desc: (s: string) => `A curated set of thoughts and observations by ${s}` },
  { name: (s: string) => `${s}: A Portrait in Quotes`, desc: (s: string) => `Understanding ${s} through their own words` },
  { name: (s: string) => `The Wit of ${s}`, desc: (s: string) => `Sharp, wise, and unforgettable — the best of ${s}` },
  { name: (s: string) => `Quoting ${s}`, desc: (s: string) => `A rich collection of quotes attributed to ${s}` },
]

const referencePatterns = [
  { name: (s: string) => `From the Pages of ${s}`, desc: (s: string) => `Iconic lines and unforgettable moments from ${s}` },
  { name: (s: string) => `Inside ${s}`, desc: (s: string) => `The quotes that define ${s} and its legacy` },
  { name: (s: string) => s, desc: (s: string) => `A curated selection of quotes drawn from ${s}` },
  { name: (s: string) => `Beyond ${s}`, desc: (s: string) => `Exploring the themes and ideas found in ${s}` },
  { name: (s: string) => `Moments from ${s}`, desc: (s: string) => `The most memorable lines and passages from ${s}` },
  { name: (s: string) => `The World of ${s}`, desc: (s: string) => `Quotes that capture the spirit of ${s}` },
  { name: (s: string) => `Revisiting ${s}`, desc: (s: string) => `Timeless quotes from ${s}, rediscovered` },
  { name: (s: string) => `Lessons from ${s}`, desc: (s: string) => `What ${s} teaches us, one quote at a time` },
]

const MIN_QUOTES = 5
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

async function generateAISuggestions(topTags: { name: string; count: number }[], topAuthors: { name: string; count: number }[], topReferences: { name: string; count: number }[], suggestionCount: number, context?: string): Promise<any[] | null> {
  const config = await getAIConfig()
  if (!config) return null

  try {
    const tagList = topTags.slice(0, 5).map(t => t.name).join(', ')
    const authorList = topAuthors.slice(0, 5).map(a => a.name).join(', ')
    const refList = topReferences.slice(0, 5).map(r => r.name).join(', ')

    const prompt = `You are a creative curator. Generate ${suggestionCount} original theme suggestions for a quote collection app.

Top tags: ${tagList || 'none'}
Top authors: ${authorList || 'none'}
Top references: ${refList || 'none'}
${context ? '\n' + context : ''}

For each suggestion, pick a primary focus (tag, author, or reference) and optionally combine related tags/authors for a richer theme.

Return a JSON array of objects with these fields:
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

    // Validate and filter suggestions
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

    const existingRows = await db.select({ slug: schema.themes.slug })
      .from(schema.themes)
      .all()
    const existingSlugs = new Set(existingRows.map(r => r.slug))

    let [topTags, topAuthors, topReferences] = await Promise.all([
      db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(eq(schema.quotes.status, 'approved'))
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
        .where(eq(schema.quotes.status, 'approved'))
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
        .where(eq(schema.quotes.status, 'approved'))
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
        .where(and(eq(schema.quotes.status, 'approved'), inArray(schema.tags.name, seedTags)))
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
      if (seedTags.length) {
        context += `\n\nSeed tags to focus on: ${seedTags.join(', ')}.\nGenerate suggestions specifically related to these themes.`
      }
      const aiSuggestions = await generateAISuggestions(topTags, topAuthors, topReferences, MAX_SUGGESTIONS, context)
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

    // --- Tag suggestions ---
    for (let i = 0; i < topTags.length; i++) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const tag = topTags[i]!
      if (tag.count < MIN_QUOTES) continue

      const title = toTitle(tag.name)
      const pattern = pick(tagPatterns, i, tag.name)!
      const name = pattern.name(title)
      if (existingSlugs.has(slugify(name))) continue

      const filters: any[] = [{ type: 'tag_name', value: tag.name, match_mode: 'any' }]

      const quotedByTag = db.select({ id: schema.quoteTags.quoteId }).from(schema.quoteTags).where(eq(schema.quoteTags.tagId, tag.id))

      const coTags = await db.select({ name: schema.tags.name, count: count(schema.quoteTags.quoteId) })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(and(
          inArray(schema.quoteTags.quoteId, quotedByTag),
          ne(schema.quoteTags.tagId, tag.id),
        ))
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(1)
        .all()

      for (const ct of coTags) filters.push({ type: 'tag_name', value: ct.name, match_mode: 'any' })

      const [tagAuthors, tagRefs] = await Promise.all([
        db.select({ name: schema.authors.name, count: count(schema.quotes.id) })
          .from(schema.quoteTags)
          .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
          .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
          .where(and(eq(schema.quoteTags.tagId, tag.id), eq(schema.quotes.status, 'approved')))
          .groupBy(schema.authors.id, schema.authors.name)
          .orderBy(desc(count(schema.quotes.id)))
          .limit(1)
          .all(),
        db.select({ name: schema.quoteReferences.name, count: count(schema.quotes.id) })
          .from(schema.quoteTags)
          .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
          .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
          .where(and(eq(schema.quoteTags.tagId, tag.id), eq(schema.quotes.status, 'approved')))
          .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
          .orderBy(desc(count(schema.quotes.id)))
          .limit(1)
          .all(),
      ])

      for (const ta of tagAuthors) filters.push({ type: 'author_name', value: ta.name, match_mode: 'any' })
      for (const tr of tagRefs) filters.push({ type: 'reference_name', value: tr.name, match_mode: 'any' })

      addSuggestion('tag', name, pattern!.desc(title), filters.slice(0, 4))
    }

    // --- Author suggestions ---
    for (let i = 0; i < topAuthors.length; i++) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const author = topAuthors[i]!
      if (author.count < MIN_QUOTES) continue

      const pattern = pick(authorPatterns, i, author.name)!
      const name = pattern.name(author.name)
      if (existingSlugs.has(slugify(name))) continue

      const filters: any[] = [{ type: 'author_name', value: author.name, match_mode: 'any' }]

      const [authorTags, authorRefs] = await Promise.all([
        db.select({ name: schema.tags.name, count: count(schema.quoteTags.quoteId) })
          .from(schema.quoteTags)
          .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
          .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
          .where(and(eq(schema.quotes.authorId, author.id), eq(schema.quotes.status, 'approved')))
          .groupBy(schema.tags.id, schema.tags.name)
          .orderBy(desc(count(schema.quoteTags.quoteId)))
          .limit(2)
          .all(),
        db.select({ name: schema.quoteReferences.name, count: count(schema.quotes.id) })
          .from(schema.quotes)
          .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
          .where(and(eq(schema.quotes.authorId, author.id), eq(schema.quotes.status, 'approved')))
          .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
          .orderBy(desc(count(schema.quotes.id)))
          .limit(2)
          .all(),
      ])

      for (const t of authorTags) filters.push({ type: 'tag_name', value: t.name, match_mode: 'any' })
      for (const r of authorRefs) filters.push({ type: 'reference_name', value: r.name, match_mode: 'any' })

      addSuggestion('author', name, pattern!.desc(author.name), filters.slice(0, 4))
    }

    // --- Reference suggestions ---
    for (let i = 0; i < topReferences.length; i++) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const ref = topReferences[i]!
      if (ref.count < MIN_QUOTES) continue

      const pattern = pick(referencePatterns, i, ref.name)!
      const name = pattern.name(ref.name)
      if (existingSlugs.has(slugify(name))) continue

      const filters: any[] = [{ type: 'reference_name', value: ref.name, match_mode: 'any' }]

      const [refTags, refAuthors] = await Promise.all([
        db.select({ name: schema.tags.name, count: count(schema.quoteTags.quoteId) })
          .from(schema.quoteTags)
          .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
          .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
          .where(and(eq(schema.quotes.referenceId, ref.id), eq(schema.quotes.status, 'approved')))
          .groupBy(schema.tags.id, schema.tags.name)
          .orderBy(desc(count(schema.quoteTags.quoteId)))
          .limit(2)
          .all(),
        db.select({ name: schema.authors.name, count: count(schema.quotes.id) })
          .from(schema.quotes)
          .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
          .where(and(eq(schema.quotes.referenceId, ref.id), eq(schema.quotes.status, 'approved')))
          .groupBy(schema.authors.id, schema.authors.name)
          .orderBy(desc(count(schema.quotes.id)))
          .limit(2)
          .all(),
      ])

      for (const t of refTags) filters.push({ type: 'tag_name', value: t.name, match_mode: 'any' })
      for (const a of refAuthors) filters.push({ type: 'author_name', value: a.name, match_mode: 'any' })

      addSuggestion('reference', name, pattern!.desc(ref.name), filters.slice(0, 4))
    }

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error generating theme suggestions:', error)
    throwServer(500, 'Failed to generate theme suggestions')
  }
})
