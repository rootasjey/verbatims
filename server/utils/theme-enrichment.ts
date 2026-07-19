import { db, schema } from 'hub:db'
import { eq, like, sql } from 'drizzle-orm'

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

  // Step 2: Apply validated filters to DB (removes hallucinations, keeps real ones)
  const finalFilters = [...validated]
  const enriched: EnrichedFilter[] = []
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


