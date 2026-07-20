import { db, schema } from 'hub:db'
import { eq, and, or, like, inArray, desc, sql, count } from 'drizzle-orm'

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

  const scheduled = candidates.find(t =>
    (t.scheduledStart && t.scheduledEnd &&
      now >= t.scheduledStart.getTime() &&
      now <= t.scheduledEnd.getTime())
  )
  if (scheduled) return scheduled as unknown as ThemeRow

  const active = candidates.find(t => t.isActive)
  if (active) return active as unknown as ThemeRow

  const defaults = candidates.filter(t => t.isDefault)
  if (defaults.length) {
    const randomIndex = Math.floor(Math.random() * defaults.length)
    return defaults[randomIndex] as unknown as ThemeRow
  }

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

function buildThemeAuthorConditions(filters: FilterRow[]) {
  const authorIdFilters = filters.filter(f => f.type === 'author_id').slice(0, 6)
  const authorNameFilters = filters.filter(f => f.type === 'author_name').slice(0, 8)

  const conditions: any[] = []

  if (authorIdFilters.length) {
    const ids = authorIdFilters.map(f => parseInt(f.value, 10)).filter(n => Number.isFinite(n))
    if (ids.length) conditions.push(inArray(schema.authors.id, ids))
  }

  if (authorNameFilters.length) {
    conditions.push(or(
      ...authorNameFilters.map(f => eq(schema.authors.name, f.value))
    ))
  }

  if (!conditions.length) return null
  return conditions.length === 1 ? conditions[0] : or(...conditions)
}

function buildThemeReferenceConditions(filters: FilterRow[]) {
  const referenceNameFilters = filters.filter(f => f.type === 'reference_name').slice(0, 8)
  const referenceIdFilters = filters.filter(f => f.type === 'reference_id').slice(0, 6)
  const authorIdFilters = filters.filter(f => f.type === 'author_id').slice(0, 6)

  const conditions: any[] = []

  if (referenceNameFilters.length) {
    conditions.push(or(
      ...referenceNameFilters.map(f => eq(schema.quoteReferences.name, f.value))
    ))
  }

  if (referenceIdFilters.length) {
    const ids = referenceIdFilters.map(f => parseInt(f.value, 10)).filter(n => Number.isFinite(n))
    if (ids.length) {
      conditions.push(inArray(schema.quoteReferences.id, ids))
    }
  }

  if (authorIdFilters.length) {
    const authorIds = authorIdFilters.map(f => parseInt(f.value, 10)).filter(n => Number.isFinite(n))
    if (authorIds.length) {
      const refSubQuery = db.select({ referenceId: schema.quotes.referenceId })
        .from(schema.quotes)
        .where(and(
          eq(schema.quotes.status, 'approved'),
          inArray(schema.quotes.authorId, authorIds)
        ))
      conditions.push(inArray(schema.quoteReferences.id, refSubQuery))
    }
  }

  if (!conditions.length) return null
  return conditions.length === 1 ? conditions[0] : or(...conditions)
}

export async function getThemeFeed(themeSlug: string, language?: string): Promise<ThemeFeedResult | null> {
  const themeRow = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.slug, themeSlug))
      .limit(1)
      .get()

    if (!themeRow) return null

    const filters = await getThemeFilters(themeRow.id)

    const matchedIds = new Set<number>()
    const baseQFilter = eq(schema.quotes.status, 'approved')

    for (const f of filters) {
      let ids: { id: number }[] = []
        if (f.type === 'tag_name') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
            .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
            .where(and(baseQFilter, like(schema.tags.name, `%${f.value}%`)))
            .limit(100)
            .all()
        } else if (f.type === 'author_name') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
            .where(and(baseQFilter, eq(schema.authors.name, f.value)))
            .limit(100)
            .all()
        } else if (f.type === 'author_id') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(and(baseQFilter, eq(schema.quotes.authorId, parseInt(f.value))))
            .limit(100)
            .all()
        } else if (f.type === 'reference_name') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
            .where(and(baseQFilter, eq(schema.quoteReferences.name, f.value)))
            .limit(100)
            .all()
        } else if (f.type === 'reference_id') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(and(baseQFilter, eq(schema.quotes.referenceId, parseInt(f.value))))
            .limit(100)
            .all()
        } else if (f.type === 'keyword') {
          ids = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(and(baseQFilter, like(schema.quotes.name, `%${f.value}%`)))
            .limit(100)
            .all()
        }
        for (const r of ids) matchedIds.add(r.id)
    }

    const allIds = [...matchedIds]

    let quotes: any[] = []
    let totalVal = 0

    if (allIds.length) {
      const chunkSize = 50
      const batches: number[][] = []
      for (let i = 0; i < allIds.length; i += chunkSize) {
        batches.push(allIds.slice(i, i + chunkSize))
      }

      const batchResults: any[][] = (await Promise.all(batches.map(batchIds => {
        const whereFinal = and(eq(schema.quotes.status, 'approved'), inArray(schema.quotes.id, batchIds))
        return db.select({
          id: schema.quotes.id,
          name: schema.quotes.name,
          language: schema.quotes.language,
          viewsCount: schema.quotes.viewsCount,
          likesCount: schema.quotes.likesCount,
          updatedAt: schema.quotes.updatedAt,
          authorId: schema.quotes.authorId,
          referenceId: schema.quotes.referenceId,
          authorName: schema.authors.name,
          referenceName: schema.quoteReferences.name,
        })
          .from(schema.quotes)
          .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
          .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
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

      totalVal = allIds.length
    }

    let authorRows: any[] = []
    const authorCondition = buildThemeAuthorConditions(filters)
      authorRows = await db.select()
        .from(schema.authors)
        .where(authorCondition || undefined)
        .orderBy(desc(schema.authors.likesCount))
        .limit(20)
        .all()

    let referenceRows: any[] = []
    const referenceCondition = buildThemeReferenceConditions(filters)
      referenceRows = await db.select()
        .from(schema.quoteReferences)
        .where(referenceCondition || undefined)
        .orderBy(desc(schema.quoteReferences.likesCount))
        .limit(20)
        .all()

    const processedQuotes = quotes.map((row: any) => ({
      id: row.id, name: row.name, language: row.language,
      views_count: row.viewsCount || 0, likes_count: row.likesCount || 0,
      updated_at: row.updatedAt,
      author: row.authorId ? { id: row.authorId, name: row.authorName } : undefined,
      reference: row.referenceId ? { id: row.referenceId, name: row.referenceName } : undefined,
    }))

    const processedAuthors = authorRows.map((row: any) => ({
      id: row.id, name: row.name, job: row.job, description: row.description,
      image_url: row.imageUrl, likes_count: row.likesCount || 0,
    }))

    const processedReferences = referenceRows.map((row: any) => ({
      id: row.id, name: row.name, description: row.description,
      primary_type: row.primaryType, image_url: row.imageUrl, likes_count: row.likesCount || 0,
    }))

    const translations = await getThemeTranslations(themeRow.id)
    const localized = resolveLocalizedField(translations, language, themeRow.name, themeRow.description)

    return {
      theme: {
        slug: themeRow.slug, name: localized.name, description: localized.description,
        config: themeRow.config ? (() => { try { return JSON.parse(themeRow.config) } catch { return null } })() : null,
        filters_count: filters.length,
      },
      quotes: processedQuotes,
      authors: processedAuthors,
      references: processedReferences,
      total: totalVal,
    }
  }


