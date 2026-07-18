import { db, schema } from 'hub:db'
import { eq, and, ne, desc, count, inArray, like, sql } from 'drizzle-orm'

export interface EntitySuggestion {
  id: number
  type: string
  suggestedValue: string
  status: string
}

export interface EnrichmentResult {
  validated: EnrichedFilter[]
  removed: EnrichedFilter[]
  enriched: EnrichedFilter[]
  suggestions: EntitySuggestion[]
  summary: string
  jobId: number
}

interface EnrichedFilter {
  type: string
  value: string
  match_mode: string
}

interface FilterCandidate {
  type: string
  value: string
  label: string
}

function mapFilterTypeToSuggestion(filterType: string): string | null {
  switch (filterType) {
    case 'tag_name': return 'tag'
    case 'author_name': return 'author'
    case 'reference_name': return 'reference'
    default: return null
  }
}

export async function enrichThemeFilters(themeId: number, userId?: number): Promise<EnrichmentResult> {
  const [theme, filters, translations] = await Promise.all([
    db.select().from(schema.themes).where(eq(schema.themes.id, themeId)).get(),
    db.select().from(schema.themeContentFilters).where(eq(schema.themeContentFilters.themeId, themeId)).all(),
    db.select().from(schema.themeTranslations).where(eq(schema.themeTranslations.themeId, themeId)).all(),
  ])

  if (!theme) throw new Error(`Theme ${themeId} not found`)

  // Step 1: Validate each filter against the DB
  const validated: EnrichedFilter[] = []
  const removed: EnrichedFilter[] = []

  for (const f of filters) {
    const exists = await filterExists(f.type, f.value)
    if (exists) {
      validated.push({ type: f.type, value: f.value, match_mode: f.matchMode || 'any' })
    } else {
      removed.push({ type: f.type, value: f.value, match_mode: f.matchMode || 'any' })
    }
  }

  // Step 1b: Create entity suggestions for hallucinated tag/author/reference filters
  const suggestions: EntitySuggestion[] = []
  for (const f of removed) {
    const sugType = mapFilterTypeToSuggestion(f.type)
    if (!sugType) continue

    await db.run(sql`
      INSERT INTO entity_suggestions (theme_id, type, suggested_value, context, status, created_by)
      VALUES (${themeId}, ${sugType}, ${f.value}, ${JSON.stringify({ filter_type: f.type, generated_by: 'enrichment' })}, 'pending', ${userId || null})
    `)

    suggestions.push({
      id: Date.now(),
      type: sugType,
      suggestedValue: f.value,
      status: 'pending',
    })
  }

  // Step 2: Enrich — find co-occurring relevant filters for what's valid
  const existingSet = new Set(validated.map(f => `${f.type}:${f.value.toLowerCase()}`))
  const candidates: FilterCandidate[] = []
  const themeName = theme.name || ''
  const words = themeName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)

  for (const f of validated) {
    const batch = await findRelatedFilters(f.type, f.value, words)
    for (const c of batch) {
      const key = `${c.type}:${c.value.toLowerCase()}`
      if (!existingSet.has(key) && !candidates.some(x => `${x.type}:${x.value.toLowerCase()}` === key)) {
        candidates.push(c)
      }
    }
  }

  const enriched = candidates.slice(0, 6).map(c => ({
    type: c.type,
    value: c.value,
    match_mode: 'any' as const,
  }))

  // Step 3: Build the final filter list — validated + enriched (deduped)
  const finalFilters = [...validated]
  for (const e of enriched) {
    const key = `${e.type}:${e.value.toLowerCase()}`
    if (!finalFilters.some(f => `${f.type}:${f.value.toLowerCase()}` === key)) {
      finalFilters.push(e)
    }
  }

  // Step 4: Auto-apply to DB (replace all filters with validated + enriched)
  await db.delete(schema.themeContentFilters).where(eq(schema.themeContentFilters.themeId, themeId))
  for (const f of finalFilters) {
    await db.run(sql`
      INSERT INTO theme_content_filters (theme_id, type, value, match_mode)
      VALUES (${themeId}, ${f.type}, ${f.value}, ${f.match_mode})
    `)
  }

  // Step 5: Record the enrichment job
  const payload = {
    original_count: filters.length,
    validated_count: validated.length,
    removed_count: removed.length,
    enriched_count: enriched.length,
    final_count: finalFilters.length,
  }

  const jobResult = {
    original: filters.map(f => ({ type: f.type, value: f.value, match_mode: f.matchMode })),
    validated,
    removed,
    enriched,
    final: finalFilters,
  }

  await db.run(sql`
    INSERT INTO theme_enrichment_jobs (theme_id, status, payload, result, created_by, processed_at)
    VALUES (${themeId}, 'completed', ${JSON.stringify(payload)}, ${JSON.stringify(jobResult)}, ${userId || null}, CAST(unixepoch() AS INTEGER))
  `)

  const parts: string[] = []
  if (removed.length > 0) parts.push(`${removed.length} filtre(s) invalide(s) supprimé(s)`)
  if (validated.length > 0) parts.push(`${validated.length} filtre(s) conservé(s)`)
  if (enriched.length > 0) parts.push(`${enriched.length} filtre(s) ajouté(s) par enrichissement`)

  return {
    validated,
    removed,
    enriched,
    suggestions,
    summary: parts.join(', ') || 'Aucun changement',
    jobId: 0,
  }
}

async function filterExists(type: string, value: string): Promise<boolean> {
  switch (type) {
    case 'tag_name': {
      const row = await db.select({ id: schema.tags.id })
        .from(schema.tags)
        .where(eq(schema.tags.name, value))
        .get()
      return !!row
    }
    case 'author_name': {
      const row = await db.select({ id: schema.authors.id })
        .from(schema.authors)
        .where(like(schema.authors.name, `%${value}%`))
        .get()
      return !!row
    }
    case 'reference_name': {
      const row = await db.select({ id: schema.quoteReferences.id })
        .from(schema.quoteReferences)
        .where(like(schema.quoteReferences.name, `%${value}%`))
        .get()
      return !!row
    }
    case 'author_id':
    case 'reference_id':
      return !isNaN(parseInt(value))
    case 'keyword':
    case 'language':
      return true
    default:
      return false
  }
}

async function findRelatedFilters(type: string, value: string, nameWords: string[]): Promise<FilterCandidate[]> {
  const candidates: FilterCandidate[] = []
  const pushIfNew = (t: string, v: string) => {
    if (!candidates.some(c => c.type === t && c.value.toLowerCase() === v.toLowerCase())) {
      candidates.push({ type: t, value: v, label: v })
    }
  }

  if (type === 'tag_name') {
    const tagRow = await db.select({ id: schema.tags.id })
      .from(schema.tags)
      .where(eq(schema.tags.name, value))
      .get()
    if (!tagRow) return candidates

    const filteredQuoteIds = db.select({ id: schema.quoteTags.quoteId })
      .from(schema.quoteTags)
      .where(eq(schema.quoteTags.tagId, tagRow.id))

    // Co-occurring tags
    const coTags = await db.select({
      name: schema.tags.name,
      count: count(schema.quoteTags.quoteId),
    })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(and(inArray(schema.quoteTags.quoteId, filteredQuoteIds), ne(schema.quoteTags.tagId, tagRow.id)))
      .groupBy(schema.tags.id, schema.tags.name)
      .orderBy(desc(count(schema.quoteTags.quoteId)))
      .limit(2)
      .all()
    for (const ct of coTags) pushIfNew('tag_name', ct.name)

    // Top authors for this tag
    const tagAuthors = await db.select({
      name: schema.authors.name,
      count: count(schema.quotes.id),
    })
      .from(schema.quoteTags)
      .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
      .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .where(and(eq(schema.quoteTags.tagId, tagRow.id), eq(schema.quotes.status, 'approved')))
      .groupBy(schema.authors.id, schema.authors.name)
      .orderBy(desc(count(schema.quotes.id)))
      .limit(2)
      .all()
    for (const ta of tagAuthors) pushIfNew('author_name', ta.name)

    // Top references for this tag
    const tagRefs = await db.select({
      name: schema.quoteReferences.name,
      count: count(schema.quotes.id),
    })
      .from(schema.quoteTags)
      .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
      .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .where(and(eq(schema.quoteTags.tagId, tagRow.id), eq(schema.quotes.status, 'approved')))
      .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
      .orderBy(desc(count(schema.quotes.id)))
      .limit(2)
      .all()
    for (const tr of tagRefs) pushIfNew('reference_name', tr.name)
  }

  if (type === 'author_name') {
    const authorRow = await db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(like(schema.authors.name, `%${value}%`))
      .get()
    if (!authorRow) return candidates

    const authorTags = await db.select({
      name: schema.tags.name,
      count: count(schema.quoteTags.quoteId),
    })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
      .where(and(eq(schema.quotes.authorId, authorRow.id), eq(schema.quotes.status, 'approved')))
      .groupBy(schema.tags.id, schema.tags.name)
      .orderBy(desc(count(schema.quoteTags.quoteId)))
      .limit(2)
      .all()
    for (const t of authorTags) pushIfNew('tag_name', t.name)

    const authorRefs = await db.select({
      name: schema.quoteReferences.name,
      count: count(schema.quotes.id),
    })
      .from(schema.quotes)
      .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .where(and(eq(schema.quotes.authorId, authorRow.id), eq(schema.quotes.status, 'approved')))
      .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
      .orderBy(desc(count(schema.quotes.id)))
      .limit(2)
      .all()
    for (const r of authorRefs) pushIfNew('reference_name', r.name)
  }

  if (type === 'reference_name') {
    const refRow = await db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(like(schema.quoteReferences.name, `%${value}%`))
      .get()
    if (!refRow) return candidates

    const refTags = await db.select({
      name: schema.tags.name,
      count: count(schema.quoteTags.quoteId),
    })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
      .where(and(eq(schema.quotes.referenceId, refRow.id), eq(schema.quotes.status, 'approved')))
      .groupBy(schema.tags.id, schema.tags.name)
      .orderBy(desc(count(schema.quoteTags.quoteId)))
      .limit(2)
      .all()
    for (const t of refTags) pushIfNew('tag_name', t.name)

    const refAuthors = await db.select({
      name: schema.authors.name,
      count: count(schema.quotes.id),
    })
      .from(schema.quotes)
      .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .where(and(eq(schema.quotes.referenceId, refRow.id), eq(schema.quotes.status, 'approved')))
      .groupBy(schema.authors.id, schema.authors.name)
      .orderBy(desc(count(schema.quotes.id)))
      .limit(2)
      .all()
    for (const a of refAuthors) pushIfNew('author_name', a.name)
  }

  // Keyword matching from theme name
  for (const word of nameWords) {
    const matchingTags = await db.select({ name: schema.tags.name })
      .from(schema.tags)
      .where(like(schema.tags.name, `%${word}%`))
      .limit(1)
      .all()
    for (const mt of matchingTags) pushIfNew('tag_name', mt.name)

    const matchingAuthors = await db.select({ name: schema.authors.name })
      .from(schema.authors)
      .where(like(schema.authors.name, `%${word}%`))
      .limit(1)
      .all()
    for (const ma of matchingAuthors) pushIfNew('author_name', ma.name)

    const matchingRefs = await db.select({ name: schema.quoteReferences.name })
      .from(schema.quoteReferences)
      .where(like(schema.quoteReferences.name, `%${word}%`))
      .limit(1)
      .all()
    for (const mr of matchingRefs) pushIfNew('reference_name', mr.name)
  }

  return candidates
}
