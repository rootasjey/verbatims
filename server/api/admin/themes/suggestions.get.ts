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
  return text.replace(/\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

function pick<T>(items: T[], index: number, key: string): T {
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

async function getAIConfig(): Promise<{ baseUrl: string; apiKey: string; model: string } | null> {
  let apiKey = process.env.AI_API_KEY || ''
  let baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'
  let model = process.env.AI_MODEL || 'openai/gpt-4o-mini'

  try {
    const rows = await db.select().from(schema.settings).all()
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    if (map.ai_base_url) baseUrl = map.ai_base_url
    if (map.ai_model) model = map.ai_model
    if (map.ai_api_key) apiKey = map.ai_api_key
  } catch {}

  if (!apiKey) return null

  return { baseUrl, apiKey, model }
}

async function generateAISuggestions(topTags: { name: string; count: number }[], topAuthors: { name: string; count: number }[], topReferences: { name: string; count: number }[], suggestionCount: number): Promise<any[] | null> {
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
      const pair = colorPairs[i % colorPairs.length]
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
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const q = getQuery(event)
    const useAI = q.ai === 'true'

    const existingRows = await db.select({ slug: schema.themes.slug })
      .from(schema.themes)
      .all()
    const existingSlugs = new Set(existingRows.map(r => r.slug))

    const [topTags, topAuthors, topReferences] = await Promise.all([
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

    if (useAI) {
      const aiSuggestions = await generateAISuggestions(topTags, topAuthors, topReferences, MAX_SUGGESTIONS)
      if (aiSuggestions) return { success: true, data: aiSuggestions }
    }

    const suggestions: any[] = []
    let colorIndex = 0

    const addSuggestion = (type: string, name: string, desc: string, filters: any[]) => {
      if (suggestions.length >= MAX_SUGGESTIONS) return
      const pair = colorPairs[colorIndex % colorPairs.length]
      colorIndex++
      suggestions.push({ type, name, slug: slugify(name), description: desc, color_primary: pair[0], color_secondary: pair[1], filters })
    }

    // --- Tag suggestions ---
    for (let i = 0; i < topTags.length; i++) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const tag = topTags[i]
      if (tag.count < MIN_QUOTES) continue

      const title = toTitle(tag.name)
      const pattern = pick(tagPatterns, i, tag.name)
      const name = pattern.name(title)
      if (existingSlugs.has(slugify(name))) continue

      const filters: any[] = [{ type: 'tag_name', value: tag.name, match_mode: 'any' }]

      const coTags = await db.select({ name: schema.tags.name, count: count(schema.quoteTags.quoteId) })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(and(
          inArray(schema.quoteTags.quoteId,
            db.select({ id: schema.quoteTags.quoteId }).from(schema.quoteTags).where(eq(schema.quoteTags.tagId, tag.id))),
          ne(schema.quoteTags.tagId, tag.id),
        ))
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const ct of coTags) filters.push({ type: 'tag_name', value: ct.name, match_mode: 'any' })

      addSuggestion('tag', name, pattern.desc(title), filters)
    }

    // --- Author suggestions ---
    for (let i = 0; i < topAuthors.length; i++) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const author = topAuthors[i]
      if (author.count < MIN_QUOTES) continue

      const pattern = pick(authorPatterns, i, author.name)
      const name = pattern.name(author.name)
      if (existingSlugs.has(slugify(name))) continue

      const filters: any[] = [{ type: 'author_name', value: author.name, match_mode: 'any' }]

      const authorTags = await db.select({ name: schema.tags.name, count: count(schema.quoteTags.quoteId) })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(and(eq(schema.quotes.authorId, author.id), eq(schema.quotes.status, 'approved')))
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const t of authorTags) filters.push({ type: 'tag_name', value: t.name, match_mode: 'any' })

      addSuggestion('author', name, pattern.desc(author.name), filters)
    }

    // --- Reference suggestions ---
    for (let i = 0; i < topReferences.length; i++) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const ref = topReferences[i]
      if (ref.count < MIN_QUOTES) continue

      const pattern = pick(referencePatterns, i, ref.name)
      const name = pattern.name(ref.name)
      if (existingSlugs.has(slugify(name))) continue

      const filters: any[] = [{ type: 'reference_name', value: ref.name, match_mode: 'any' }]

      const refTags = await db.select({ name: schema.tags.name, count: count(schema.quoteTags.quoteId) })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(and(eq(schema.quotes.referenceId, ref.id), eq(schema.quotes.status, 'approved')))
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const t of refTags) filters.push({ type: 'tag_name', value: t.name, match_mode: 'any' })

      addSuggestion('reference', name, pattern.desc(ref.name), filters)
    }

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error generating theme suggestions:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate theme suggestions' })
  }
})
