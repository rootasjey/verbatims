import { db, schema } from 'hub:db'
import { eq, and, or, like, inArray, desc, sql, count } from 'drizzle-orm'

export interface ThemeRow {
  id: number
  slug: string
  name: string
  description: string | null
  image_url: string | null
  config: string | null
  is_active: boolean
  is_default: boolean
  scheduled_date: string | null
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
    image_url: string | null
    config: Record<string, any> | null
    filters_count: number
  }
  quotes: any[]
  authors: any[]
  references: any[]
  total: number
}

export async function resolveActiveTheme(): Promise<ThemeRow | null> {
  const now = Date.now()
  const today = new Date().toISOString().split('T')[0]

  const allThemes = await db.select()
    .from(schema.themes)
    .orderBy(desc(schema.themes.priority))
    .all()

  if (!allThemes.length) return null

  const scheduled = allThemes.find(t =>
    t.scheduledDate === today ||
    (t.scheduledStart && t.scheduledEnd &&
      now >= t.scheduledStart.getTime() &&
      now <= t.scheduledEnd.getTime())
  )
  if (scheduled) return scheduled as unknown as ThemeRow

  const active = allThemes.find(t => t.isActive)
  if (active) return active as unknown as ThemeRow

  const defaults = allThemes.filter(t => t.isDefault)
  if (defaults.length) {
    const randomIndex = Math.floor(Math.random() * defaults.length)
    return defaults[randomIndex] as unknown as ThemeRow
  }

  return null
}

export async function getThemeFilters(themeId: number): Promise<FilterRow[]> {
  return db.select()
    .from(schema.themeContentFilters)
    .where(eq(schema.themeContentFilters.themeId, themeId))
    .all() as unknown as FilterRow[]
}

function buildThemeQuoteConditions(filters: FilterRow[]) {
  if (!filters.length) return null

  const keywordFilters = filters.filter(f => f.type === 'keyword')
  const tagFilters = filters.filter(f => f.type === 'tag_name')
  const authorIdFilters = filters.filter(f => f.type === 'author_id')
  const authorNameFilters = filters.filter(f => f.type === 'author_name')
  const referenceNameFilters = filters.filter(f => f.type === 'reference_name')
  const referenceIdFilters = filters.filter(f => f.type === 'reference_id')

  const conditions: any[] = []

  if (keywordFilters.length) {
    conditions.push(or(
      ...keywordFilters.map(f => like(schema.quotes.name, `%${f.value}%`))
    ))
  }

  if (tagFilters.length) {
    const tagSubQuery = db.select({ quoteId: schema.quoteTags.quoteId })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(or(
        ...tagFilters.map(f => like(schema.tags.name, `%${f.value}%`))
      ))
    conditions.push(inArray(schema.quotes.id, tagSubQuery))
  }

  if (authorIdFilters.length) {
    const ids = authorIdFilters.map(f => parseInt(f.value, 10)).filter(n => Number.isFinite(n))
    if (ids.length) {
      conditions.push(inArray(schema.quotes.authorId, ids))
    }
  }

  if (authorNameFilters.length) {
    const authorSubQuery = db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(or(
        ...authorNameFilters.map(f => like(schema.authors.name, `%${f.value}%`))
      ))
    conditions.push(inArray(schema.quotes.authorId, authorSubQuery))
  }

  if (referenceNameFilters.length) {
    const refSubQuery = db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(or(
        ...referenceNameFilters.map(f => like(schema.quoteReferences.name, `%${f.value}%`))
      ))
    conditions.push(inArray(schema.quotes.referenceId, refSubQuery))
  }

  if (referenceIdFilters.length) {
    const ids = referenceIdFilters.map(f => parseInt(f.value, 10)).filter(n => Number.isFinite(n))
    if (ids.length) {
      conditions.push(inArray(schema.quotes.referenceId, ids))
    }
  }

  if (!conditions.length) return null

  return conditions.length === 1 ? conditions[0] : or(...conditions)
}

function buildThemeAuthorConditions(filters: FilterRow[]) {
  const authorIdFilters = filters.filter(f => f.type === 'author_id')
  const authorNameFilters = filters.filter(f => f.type === 'author_name')

  const conditions: any[] = []

  if (authorIdFilters.length) {
    const ids = authorIdFilters.map(f => parseInt(f.value, 10)).filter(n => Number.isFinite(n))
    if (ids.length) conditions.push(inArray(schema.authors.id, ids))
  }

  if (authorNameFilters.length) {
    conditions.push(or(
      ...authorNameFilters.map(f => like(schema.authors.name, `%${f.value}%`))
    ))
  }

  if (!conditions.length) return null
  return conditions.length === 1 ? conditions[0] : or(...conditions)
}

function buildThemeReferenceConditions(filters: FilterRow[]) {
  const referenceNameFilters = filters.filter(f => f.type === 'reference_name')
  const referenceIdFilters = filters.filter(f => f.type === 'reference_id')
  const authorIdFilters = filters.filter(f => f.type === 'author_id')

  const conditions: any[] = []

  if (referenceNameFilters.length) {
    conditions.push(or(
      ...referenceNameFilters.map(f => like(schema.quoteReferences.name, `%${f.value}%`))
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

export async function getThemeFeed(themeSlug: string): Promise<ThemeFeedResult | null> {
  const themeRow = await db.select()
    .from(schema.themes)
    .where(eq(schema.themes.slug, themeSlug))
    .limit(1)
    .get()

  if (!themeRow) return null

  const filters = await getThemeFilters(themeRow.id)
  const quoteConditions = buildThemeQuoteConditions(filters)

  const baseCondition = eq(schema.quotes.status, 'approved')
  const whereCondition = quoteConditions
    ? and(baseCondition, quoteConditions)
    : baseCondition

  const quotes = await db.select({
    id: schema.quotes.id,
    name: schema.quotes.name,
    language: schema.quotes.language,
    status: schema.quotes.status,
    viewsCount: schema.quotes.viewsCount,
    likesCount: schema.quotes.likesCount,
    sharesCount: schema.quotes.sharesCount,
    isFeatured: schema.quotes.isFeatured,
    createdAt: schema.quotes.createdAt,
    updatedAt: schema.quotes.updatedAt,
    authorId: schema.quotes.authorId,
    referenceId: schema.quotes.referenceId,
    userId: schema.quotes.userId,
    authorName: schema.authors.name,
    authorIsFictional: schema.authors.isFictional,
    authorImageUrl: schema.authors.imageUrl,
    referenceName: schema.quoteReferences.name,
    referenceType: schema.quoteReferences.primaryType,
    userName: schema.users.name,
    tagNames: sql<string>`GROUP_CONCAT(${schema.tags.name})`,
    tagColors: sql<string>`GROUP_CONCAT(${schema.tags.color})`,
  })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .leftJoin(schema.quoteTags, eq(schema.quotes.id, schema.quoteTags.quoteId))
    .leftJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
    .where(whereCondition)
    .groupBy(schema.quotes.id)
    .orderBy(desc(schema.quotes.likesCount))
    .limit(50)
    .all()

  const total = await db.select({ total: count(schema.quotes.id) })
    .from(schema.quotes)
    .where(whereCondition)
    .get()

  const authorCondition = buildThemeAuthorConditions(filters)
  const authorRows = await db.select()
    .from(schema.authors)
    .where(authorCondition || undefined)
    .orderBy(desc(schema.authors.likesCount))
    .limit(20)
    .all()

  const referenceCondition = buildThemeReferenceConditions(filters)
  const referenceRows = await db.select()
    .from(schema.quoteReferences)
    .where(referenceCondition || undefined)
    .orderBy(desc(schema.quoteReferences.likesCount))
    .limit(20)
    .all()

  const processedQuotes = quotes.map((row: any) => {
    const tags = row.tagNames
      ? row.tagNames.split(',').map((name: string, index: number) => ({
          name,
          color: row.tagColors?.split(',')[index],
        }))
      : []

    return {
      id: row.id,
      name: row.name,
      language: row.language,
      status: row.status,
      views_count: row.viewsCount,
      likes_count: row.likesCount,
      shares_count: row.sharesCount,
      is_featured: row.isFeatured,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      author: row.authorId
        ? {
            id: row.authorId,
            name: row.authorName,
            is_fictional: row.authorIsFictional,
            image_url: row.authorImageUrl,
          }
        : undefined,
      reference: row.referenceId
        ? {
            id: row.referenceId,
            name: row.referenceName,
            primary_type: row.referenceType,
          }
        : undefined,
      user: {
        id: row.userId,
        name: row.userName,
      },
      tags,
    }
  })

  const processedAuthors = authorRows.map((row: any) => ({
    id: row.id,
    name: row.name,
    is_fictional: row.isFictional,
    birth_date: row.birthDate,
    birth_location: row.birthLocation,
    death_date: row.deathDate,
    death_location: row.deathLocation,
    job: row.job,
    description: row.description,
    image_url: row.imageUrl,
    socials: row.socials,
    views_count: row.viewsCount,
    likes_count: row.likesCount,
    shares_count: row.sharesCount,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }))

  const processedReferences = referenceRows.map((row: any) => ({
    id: row.id,
    name: row.name,
    original_language: row.originalLanguage,
    release_date: row.releaseDate,
    description: row.description,
    primary_type: row.primaryType,
    secondary_type: row.secondaryType,
    image_url: row.imageUrl,
    urls: row.urls,
    views_count: row.viewsCount,
    likes_count: row.likesCount,
    shares_count: row.sharesCount,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }))

  let config: Record<string, any> | null = null
  if (themeRow.config) {
    try {
      config = JSON.parse(themeRow.config)
    } catch {
      config = null
    }
  }

  return {
    theme: {
      slug: themeRow.slug,
      name: themeRow.name,
      description: themeRow.description,
      image_url: themeRow.imageUrl,
      config,
      filters_count: filters.length,
    },
    quotes: processedQuotes,
    authors: processedAuthors,
    references: processedReferences,
    total: total?.total || 0,
  }
}
