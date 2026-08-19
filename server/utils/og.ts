import { db, schema } from 'hub:db'
import { eq, and, asc } from 'drizzle-orm'
import { getReferenceBadgeColor } from '#shared/constants/reference'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'

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
  isFictional: boolean
  updatedAt: string | null
}

export interface ReferenceOgPayload {
  id: number
  name: string
  primaryType: string
  badgeColor: string
  secondaryType?: string
  description?: string
  updatedAt: string | null
}

export async function getApprovedQuoteForOg(quoteId: string): Promise<QuoteOgPayload | null> {
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

  const provenance = await getQuoteProvenance(record.id)
  const attribution = provenance.attributions.find(item => item.is_primary) ?? provenance.attributions[0]

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

export async function getAuthorForOg(authorId: string): Promise<AuthorOgPayload | null> {
  const record = await db.select({
    id: schema.authors.id,
    name: schema.authors.name,
    job: schema.authors.job,
    description: schema.authors.description,
    isFictional: schema.authors.isFictional,
    updatedAt: schema.authors.updatedAt,
  })
  .from(schema.authors)
  .where(eq(schema.authors.id, Number(authorId)))
  .limit(1)
  .get()

  if (!record) return null

  return {
    id: record.id,
    name: record.name,
    job: record.job ?? undefined,
    description: record.description ?? undefined,
    isFictional: Boolean(record.isFictional),
    updatedAt: toIsoString(record.updatedAt)
  }
}

export async function getReferenceForOg(referenceId: string): Promise<ReferenceOgPayload | null> {
  const record = await db.select({
    id: schema.quoteReferences.id,
    name: schema.quoteReferences.name,
    primaryType: schema.quoteReferences.primaryType,
    secondaryType: schema.quoteReferences.secondaryType,
    description: schema.quoteReferences.description,
    updatedAt: schema.quoteReferences.updatedAt,
  })
  .from(schema.quoteReferences)
  .where(eq(schema.quoteReferences.id, Number(referenceId)))
  .limit(1)
  .get()

  if (!record) return null

  return {
    id: record.id,
    name: record.name,
    primaryType: record.primaryType ?? 'other',
    badgeColor: getReferenceBadgeColor(record.primaryType),
    secondaryType: record.secondaryType ?? undefined,
    description: record.description ?? undefined,
    updatedAt: toIsoString(record.updatedAt)
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
