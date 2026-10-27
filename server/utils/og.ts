import { db, schema } from 'hub:db'
import { eq, and, asc, desc, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'
import { localizeAuthors, localizeReferences, type ContentLanguage } from './entity-translations'

export function getOgLanguage(event: H3Event): ContentLanguage {
  return getQuery(event).locale === 'fr' ? 'fr' : 'en'
}

export interface QuoteOgPayload {
  id: number
  text: string
  authorName?: string
  authorImageUrl?: string | null
  referenceName?: string
  referenceImageUrl?: string | null
  language: string
  updatedAt: string | null
  tags?: Array<{
    id: number
    name: string
    color: string
  }>
}

export interface AuthorOgPayload {
  id: number
  name: string
  job?: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  isFictional: boolean
  updatedAt: string | null
}

export interface ReferenceOgPayload {
  id: number
  name: string
  primaryType: string
  secondaryType?: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  updatedAt: string | null
}

export interface TagOgPayload {
  id: number
  name: string
  description?: string
  color?: string
  quoteCount: number
  featuredQuote?: {
    text: string
    authorName?: string
    referenceName?: string
  }
  updatedAt: string | null
}

export async function getApprovedQuoteForOg(quoteId: string, language: ContentLanguage = 'en'): Promise<QuoteOgPayload | null> {
  const record = await db.select({
    id: schema.quotes.id,
    name: schema.quotes.name,
    language: schema.quotes.language,
    updatedAt: schema.quotes.updatedAt,
  })
  .from(schema.quotes)
  .where(and(
    eq(schema.quotes.id, Number(quoteId)),
    eq(schema.quotes.status, 'approved')
  ))
  .limit(1)
  .get()

  if (!record) return null

  const provenance = await getPrimaryQuoteProvenance([record.id], language)
  const attributions = provenance.get(record.id)?.attributions ?? []
  const attribution = attributions.find(item => item.is_primary) ?? attributions[0]

  const tags = await db.select({
    id: schema.tags.id,
    name: schema.tags.name,
    color: schema.tags.color,
  })
  .from(schema.tags)
  .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
  .where(eq(schema.quoteTags.quoteId, Number(quoteId)))
  .orderBy(asc(schema.tags.name))
  .all()

  const updatedAtISO = toIsoString(record.updatedAt)

  return {
    id: record.id,
    text: record.name,
    authorName: attribution?.author?.name ?? undefined,
    authorImageUrl: attribution?.author?.image_url ?? undefined,
    referenceName: attribution?.reference?.name ?? undefined,
    referenceImageUrl: attribution?.reference?.image_url ?? undefined,
    language: record.language ?? 'en',
    updatedAt: updatedAtISO,
    tags: tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color ?? '#0BA6DF'
    }))
  }
}

export async function getAuthorForOg(authorId: string, language: ContentLanguage = 'en'): Promise<AuthorOgPayload | null> {
  const record = await db.select({
    id: schema.authors.id,
    name: schema.authors.name,
    job: schema.authors.job,
    description: schema.authors.description,
    imageUrl: schema.authors.imageUrl,
    imageAlt: schema.authors.imageAlt,
    isFictional: schema.authors.isFictional,
    updatedAt: schema.authors.updatedAt,
  })
  .from(schema.authors)
  .where(eq(schema.authors.id, Number(authorId)))
  .limit(1)
  .get()

  if (!record) return null

  const author = (await localizeAuthors([record], language))[0] ?? record

  return {
    id: author.id,
    name: author.name,
    job: author.job ?? undefined,
    description: author.description ?? undefined,
    imageUrl: getRenderableOgImageUrl(record.imageUrl),
    imageAlt: record.imageAlt ?? undefined,
    isFictional: Boolean(author.isFictional),
    updatedAt: toIsoString(record.updatedAt)
  }
}

export async function getReferenceForOg(referenceId: string, language: ContentLanguage = 'en'): Promise<ReferenceOgPayload | null> {
  const record = await db.select({
    id: schema.quoteReferences.id,
    name: schema.quoteReferences.name,
    primaryType: schema.quoteReferences.primaryType,
    secondaryType: schema.quoteReferences.secondaryType,
    description: schema.quoteReferences.description,
    imageUrl: schema.quoteReferences.imageUrl,
    imageAlt: schema.quoteReferences.imageAlt,
    updatedAt: schema.quoteReferences.updatedAt,
  })
  .from(schema.quoteReferences)
  .where(eq(schema.quoteReferences.id, Number(referenceId)))
  .limit(1)
  .get()

  if (!record) return null

  const reference = (await localizeReferences([record], language))[0] ?? record

  return {
    id: reference.id,
    name: reference.name ?? record.name,
    primaryType: record.primaryType ?? 'other',
    secondaryType: record.secondaryType ?? undefined,
    description: reference.description ?? undefined,
    imageUrl: getRenderableOgImageUrl(record.imageUrl),
    imageAlt: record.imageAlt ?? undefined,
    updatedAt: toIsoString(record.updatedAt)
  }
}

function getRenderableOgImageUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  if (value.startsWith('/blob/images/')) return value

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || isPrivateOgHost(url.hostname)) {
      return undefined
    }
    return url.toString()
  } catch {
    return undefined
  }
}

function isPrivateOgHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.startsWith('[')) {
    return true
  }

  const octets = host.split('.').map(Number)
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
    return false
  }

  const [first = 0, second = 0] = octets
  return first === 0
    || first === 10
    || first === 127
    || first >= 224
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 198 && (second === 18 || second === 19))
}

export async function getTagForOg(tagId: string, language: ContentLanguage = 'en'): Promise<TagOgPayload | null> {
  const id = Number(tagId)
  if (!Number.isSafeInteger(id) || id < 1) return null

  const [tag, countResult] = await Promise.all([
    db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      description: schema.tags.description,
      color: schema.tags.color,
      updatedAt: schema.tags.updatedAt,
    })
      .from(schema.tags)
      .where(eq(schema.tags.id, id))
      .limit(1)
      .get(),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.quoteTags)
      .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.quoteTags.tagId, id),
        eq(schema.quotes.status, 'approved')
      ))
      .get(),
  ])

  if (!tag) return null

  const quoteCount = Number(countResult?.count ?? 0)
  const featuredQuote = quoteCount > 0
    ? await db.select({
        text: schema.quotes.name,
        authorName: schema.authors.name,
        referenceId: schema.quoteReferences.id,
        referenceName: schema.quoteReferences.name,
      })
        .from(schema.quoteTags)
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .leftJoin(schema.quoteAttributions, and(
          eq(schema.quoteAttributions.quoteId, schema.quotes.id),
          eq(schema.quoteAttributions.isPrimary, true)
        ))
        .leftJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
        .leftJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
        .where(and(
          eq(schema.quoteTags.tagId, id),
          eq(schema.quotes.status, 'approved')
        ))
        .orderBy(desc(schema.quotes.isFeatured), desc(schema.quotes.viewsCount), desc(schema.quotes.id))
        .limit(1)
        .get()
    : undefined

  const localizedReference = featuredQuote?.referenceId
    ? (await localizeReferences([{
        id: featuredQuote.referenceId,
        name: featuredQuote.referenceName,
      }], language))[0]
    : undefined

  return {
    id: tag.id,
    name: tag.name,
    description: tag.description ?? undefined,
    color: tag.color ?? undefined,
    quoteCount,
    featuredQuote: featuredQuote
      ? {
          text: featuredQuote.text,
          authorName: featuredQuote.authorName ?? undefined,
          referenceName: localizedReference?.name ?? featuredQuote.referenceName ?? undefined,
        }
      : undefined,
    updatedAt: toIsoString(tag.updatedAt),
  }
}

function toIsoString(value: unknown): string | null {
  if (!value) return null

  try {
    const date = new Date(value as string | number | Date)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  } catch {
    return null
  }

  return null
}
