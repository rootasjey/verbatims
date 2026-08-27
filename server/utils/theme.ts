import { db, schema } from 'hub:db'
import { eq, and, like, inArray, desc } from 'drizzle-orm'
import { combineFilterMatchSets, getThemeContentLanguages } from './theme-selection'
import { getPrimaryQuoteProvenance } from './quote-provenance'

type QuoteLanguage = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh' | 'la'

export interface ThemeTranslationRow {
  id: number
  theme_id: number
  language: string
  name: string
  description: string | null
}

export interface ThemeRow {
  id: number
  slug: string
  name: string
  description: string | null
  language: string | null
  config: string | null
  is_active: boolean
  is_default: boolean
  scheduled_start: Date | null
  scheduled_end: Date | null
  priority: number
  created_at: Date | null
  updated_at: Date | null
}

export interface FilterRow {
  id: number
  theme_id: number
  type: string
  value: string
  match_mode: string
}

export interface ThemeFeedResult {
  theme: {
    slug: string
    name: string
    description: string | null
    config: Record<string, any> | null
    filters_count: number
  }
  quotes: any[]
  authors: any[]
  references: any[]
  total: number
}

function themeMatchesLanguage(theme: typeof schema.themes.$inferSelect, language?: string): boolean {
  if (!language) return true
  if (!theme.language) return true
  return theme.language === language
}

export function resolveLocalizedField(
  translations: ThemeTranslationRow[],
  language: string | undefined,
  fallbackName: string,
  fallbackDescription: string | null
): { name: string; description: string | null } {
  if (language && translations.length) {
    const t = translations.find(t => t.language === language)
    if (t) return { name: t.name, description: t.description ?? fallbackDescription }
  }
  return { name: fallbackName, description: fallbackDescription }
}

export async function getThemeTranslations(themeId: number): Promise<ThemeTranslationRow[]> {
  return db.select()
    .from(schema.themeTranslations)
    .where(eq(schema.themeTranslations.themeId, themeId))
    .all() as unknown as ThemeTranslationRow[]
}

export async function resolveActiveTheme(language?: string): Promise<ThemeRow | null> {
  const now = Date.now()

  const allThemes = await db.select()
    .from(schema.themes)
    .orderBy(desc(schema.themes.priority))
    .all()

  if (!allThemes.length) return null

  const byLanguage = language ? allThemes.filter(t => themeMatchesLanguage(t, language)) : allThemes
  const candidates = byLanguage.length ? byLanguage : allThemes

  const pickFrom = (list: typeof allThemes) => {
    const scheduled = list.find(t =>
      (t.scheduledStart && t.scheduledEnd &&
        now >= t.scheduledStart.getTime() &&
        now <= t.scheduledEnd.getTime())
    )
    if (scheduled) return scheduled as unknown as ThemeRow

    const active = list.find(t => t.isActive && (!t.scheduledStart || now >= t.scheduledStart.getTime()))
    if (active) return active as unknown as ThemeRow

    const defaults = list.filter(t => t.isDefault && (!t.scheduledStart || now >= t.scheduledStart.getTime()))
    if (defaults.length) {
      return defaults[Math.floor(Math.random() * defaults.length)] as unknown as ThemeRow
    }
    return null
  }

  const result = pickFrom(candidates) || pickFrom(allThemes)
  if (result) return result

  if (byLanguage.length === 0 && language) {
    return resolveActiveTheme()
  }

  return null
}

export async function getThemeFilters(themeId: number): Promise<FilterRow[]> {
  return db.select()
    .from(schema.themeContentFilters)
    .where(eq(schema.themeContentFilters.themeId, themeId))
    .all() as unknown as FilterRow[]
}

export async function getThemeFeed(themeSlug: string, language?: string): Promise<ThemeFeedResult | null> {
  const themeRow = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.slug, themeSlug))
      .limit(1)
      .get()

    if (!themeRow) return null

    let themeConfig: Record<string, any> = {}
    if (themeRow.config) {
      try { themeConfig = JSON.parse(themeRow.config) } catch {}
    }

    const filters = await getThemeFilters(themeRow.id)

    const contentLanguages = getThemeContentLanguages(themeRow.language, filters) as QuoteLanguage[] | null
    const languageCondition = contentLanguages?.length
      ? inArray(schema.quotes.language, contentLanguages)
      : undefined
    const baseQFilter = eq(schema.quotes.status, 'approved')
    const contentFilters = filters.filter(f => f.type !== 'language')
    const filterMatchSets: { ids: number[]; matchMode: string }[] = []

    for (const f of contentFilters) {
      let ids: { id: number }[] = []
        const filterConditions = [baseQFilter, languageCondition].filter(Boolean)
        if (f.type === 'tag_name') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
            .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
            .where(and(...filterConditions, like(schema.tags.name, `%${f.value}%`)))
            .all()
        } else if (f.type === 'author_name') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteAttributions, eq(schema.quotes.id, schema.quoteAttributions.quoteId))
            .innerJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
            .where(and(...filterConditions, eq(schema.authors.name, f.value)))
            .all()
        } else if (f.type === 'author_id') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteAttributions, eq(schema.quotes.id, schema.quoteAttributions.quoteId))
            .where(and(...filterConditions, eq(schema.quoteAttributions.authorId, parseInt(f.value))))
            .all()
        } else if (f.type === 'reference_name') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteAttributions, eq(schema.quotes.id, schema.quoteAttributions.quoteId))
            .innerJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
            .where(and(...filterConditions, eq(schema.quoteReferences.name, f.value)))
            .all()
        } else if (f.type === 'reference_id') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteAttributions, eq(schema.quotes.id, schema.quoteAttributions.quoteId))
            .where(and(...filterConditions, eq(schema.quoteAttributions.referenceId, parseInt(f.value))))
            .all()
        } else if (f.type === 'keyword') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(and(...filterConditions, like(schema.quotes.name, `%${f.value}%`)))
            .all()
        }
        filterMatchSets.push({ ids: ids.map(row => row.id), matchMode: f.match_mode || 'any' })
    }

    let matchedIds = combineFilterMatchSets(filterMatchSets)

    if (!contentFilters.length) {
      const rows = await db.select({ id: schema.quotes.id })
        .from(schema.quotes)
        .where(and(baseQFilter, languageCondition))
        .all()
      matchedIds = rows.map(row => row.id)
    }

    // Ensure the featured quote is always included, even if not matched by filters
    if (themeConfig.featured_quote_id) {
      matchedIds.push(themeConfig.featured_quote_id)
    }

    const allIds = [...new Set(matchedIds)]

    let quotes: any[] = []
    let totalVal = 0

    if (allIds.length) {
      const chunkSize = 50
      const batches: number[][] = []
      for (let i = 0; i < allIds.length; i += chunkSize) {
        batches.push(allIds.slice(i, i + chunkSize))
      }

      const batchResults: any[][] = (await Promise.all(batches.map(batchIds => {
        const whereFinal = and(eq(schema.quotes.status, 'approved'), inArray(schema.quotes.id, batchIds), languageCondition)
        return db.select({
          id: schema.quotes.id,
          name: schema.quotes.name,
          language: schema.quotes.language,
          createdAt: schema.quotes.createdAt,
          viewsCount: schema.quotes.viewsCount,
          likesCount: schema.quotes.likesCount,
          updatedAt: schema.quotes.updatedAt,
        })
          .from(schema.quotes)
          .where(whereFinal)
          .orderBy(desc(schema.quotes.likesCount))
          .limit(50)
          .all()
      }))).filter(Boolean)

      const merged = batchResults.flat()
      for (let i = merged.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [merged[i], merged[j]] = [merged[j], merged[i]]
      }
      quotes = merged.slice(0, 50)

      totalVal = merged.length
    }

    const provenance = await getPrimaryQuoteProvenance(quotes.map(row => row.id))
    const primaryAttributions = quotes.map((quote) => {
      const quoteProvenance = provenance.get(quote.id)
      return quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
    })
    const authorIds = [...new Set(primaryAttributions.map(attribution => attribution?.author_id).filter((id): id is number => !!id))]
    const referenceIds = [...new Set(primaryAttributions.map(attribution => attribution?.reference_id).filter((id): id is number => !!id))]
    const authorQuoteCounts = new Map<number, number>()
    for (const attribution of primaryAttributions) {
      if (!attribution?.author_id) continue
      authorQuoteCounts.set(attribution.author_id, (authorQuoteCounts.get(attribution.author_id) || 0) + 1)
    }
    const authorRows = authorIds.length
      ? await db.select().from(schema.authors).where(inArray(schema.authors.id, authorIds)).orderBy(desc(schema.authors.likesCount)).all()
      : []
    const referenceRows = referenceIds.length
      ? await db.select().from(schema.quoteReferences).where(inArray(schema.quoteReferences.id, referenceIds)).orderBy(desc(schema.quoteReferences.likesCount)).all()
      : []

    const processedQuotes = quotes.map((row: any) => {
      const attribution = provenance.get(row.id)?.attributions.find(item => item.is_primary)
        ?? provenance.get(row.id)?.attributions[0]
      return {
      id: row.id, name: row.name, language: row.language,
      created_at: row.createdAt,
      views_count: row.viewsCount || 0, likes_count: row.likesCount || 0,
      updated_at: row.updatedAt,
      author: attribution?.author_id ? attribution.author : undefined,
      reference: attribution?.reference_id ? attribution.reference : undefined,
      attributions: provenance.get(row.id)?.attributions ?? [],
      sources: provenance.get(row.id)?.sources ?? [],
    }
    })

    // Prioritize quotes matching the theme's language
    if (themeRow.language) {
      processedQuotes.sort((a, b) => {
        if (a.language === themeRow.language && b.language !== themeRow.language) return -1
        if (a.language !== themeRow.language && b.language === themeRow.language) return 1
        return 0
      })
    }

    const processedAuthors = authorRows.map((row: any) => ({
      id: row.id, name: row.name, job: row.job, description: row.description,
      image_url: row.imageUrl, likes_count: row.likesCount || 0,
      quotes_count: authorQuoteCounts.get(row.id) || 0,
    }))

    const processedReferences = referenceRows.map((row: any) => ({
      id: row.id, name: row.name, description: row.description,
      primary_type: row.primaryType, image_url: row.imageUrl, likes_count: row.likesCount || 0,
    }))

    if (themeConfig.featured_quote_id) {
      const found = processedQuotes.find(q => q.id === themeConfig.featured_quote_id)
      if (found) {
        const idx = processedQuotes.indexOf(found)
        if (idx > 0) {
          processedQuotes.splice(idx, 1)
          processedQuotes.unshift(found)
        }
      }
    }

    if (themeConfig.featured_reference_id) {
      const found = processedReferences.find(r => r.id === themeConfig.featured_reference_id)
      if (found) {
        const idx = processedReferences.indexOf(found)
        if (idx > 0) {
          processedReferences.splice(idx, 1)
          processedReferences.unshift(found)
        }
      }
    }

    const translations = await getThemeTranslations(themeRow.id)
    const localized = resolveLocalizedField(translations, language, themeRow.name, themeRow.description)

    return {
      theme: {
        slug: themeRow.slug, name: localized.name, description: localized.description,
        config: themeConfig,
        filters_count: filters.length,
      },
      quotes: processedQuotes,
      authors: processedAuthors,
      references: processedReferences,
      total: totalVal,
    }
  }
