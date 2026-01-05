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

  if (!record) {
    return null
  }

  return {
    id: record.id,
    text: record.name,
    authorName: record.authorName ?? undefined,
    referenceName: record.referenceName ?? undefined,
    language: record.language ?? 'en',
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null
  }
}