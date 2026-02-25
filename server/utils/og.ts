import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export interface QuoteOgPayload {
  id: number
  text: string
  authorName?: string
  referenceName?: string
  language: string
  updatedAt: string | null
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
  secondaryType?: string
  description?: string
  updatedAt: string | null
}

export async function getApprovedQuoteForOg(quoteId: string): Promise<QuoteOgPayload | null> {
  const record = await db.select({
    id: schema.quotes.id,
    name: schema.quotes.name,
    authorId: schema.quotes.authorId,
    authorName: schema.authors.name,
    referenceId: schema.quotes.referenceId,
    referenceName: schema.quoteReferences.name,
    language: schema.quotes.language,
    updatedAt: schema.quotes.updatedAt,
  })
  .from(schema.quotes)
  .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
  .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
  .where(and(
    eq(schema.quotes.id, Number(quoteId)),
    eq(schema.quotes.status, 'approved')
  ))
  .limit(1)
  .get()

  if (!record) return null

  const updatedAtISO = toIsoString(record.updatedAt)

  return {
    id: record.id,
    text: record.name,
    authorName: record.authorName ?? undefined,
    referenceName: record.referenceName ?? undefined,
    language: record.language ?? 'en',
    updatedAt: updatedAtISO
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