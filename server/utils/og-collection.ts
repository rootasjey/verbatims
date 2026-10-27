import { db, schema } from 'hub:db'
import { and, desc, eq, sql } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

export interface CollectionOgPreview {
  id: number
  isPublic: boolean
  name: string | null
  description: string | null
  updatedAt: number | null
  quoteCount: number
  quotes: Array<{ text: string; author: string | null; reference: string | null }>
}

export async function getCollectionOgPreview(id: number): Promise<CollectionOgPreview | null> {
  const collection = await db.select({
    id: schema.userCollections.id,
    name: schema.userCollections.name,
    description: schema.userCollections.description,
    isPublic: schema.userCollections.isPublic,
    updatedAt: schema.userCollections.updatedAt,
  })
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, id))
    .limit(1)
    .get()

  if (!collection) return null

  if (!collection.isPublic) {
    return {
      id,
      isPublic: false,
      name: null,
      description: null,
      updatedAt: collection.updatedAt?.getTime() ?? null,
      quoteCount: 0,
      quotes: [],
    }
  }

  const [quoteCountResult, quoteRows] = await Promise.all([
    db.select({ total: sql<number>`COUNT(*)` })
      .from(schema.collectionQuotes)
      .innerJoin(schema.quotes, eq(schema.collectionQuotes.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.collectionQuotes.collectionId, id),
        eq(schema.quotes.status, 'approved'),
      ))
      .get(),
    db.select({ id: schema.quotes.id, text: schema.quotes.name })
      .from(schema.collectionQuotes)
      .innerJoin(schema.quotes, eq(schema.collectionQuotes.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.collectionQuotes.collectionId, id),
        eq(schema.quotes.status, 'approved'),
      ))
      .orderBy(desc(schema.collectionQuotes.addedAt))
      .limit(3)
      .all(),
  ])

  const provenance = await getPrimaryQuoteProvenance(quoteRows.map(quote => quote.id))
  return {
    id,
    isPublic: true,
    name: collection.name,
    description: collection.description,
    updatedAt: collection.updatedAt?.getTime() ?? null,
    quoteCount: Number(quoteCountResult?.total) || 0,
    quotes: quoteRows.map((quote) => {
      const attributions = provenance.get(quote.id)?.attributions ?? []
      const attribution = attributions.find(item => item.is_primary) ?? attributions[0]
      return {
        text: quote.text,
        author: attribution?.author?.name ?? null,
        reference: attribution?.reference?.name ?? null,
      }
    }),
  }
}
