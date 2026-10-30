import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export async function requireQuote(quoteId: number) {
  const quote = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .get()
  if (!quote) throwServer(404, 'Quote not found')
  return quote
}

export async function requireQuoteAttribution(quoteId: number, attributionId: number) {
  const attribution = await db.select()
    .from(schema.quoteAttributions)
    .where(eq(schema.quoteAttributions.id, attributionId))
    .get()
  if (!attribution || attribution.quoteId !== quoteId) throwServer(404, 'Attribution not found')
  return attribution
}

export async function requireQuoteSource(quoteId: number, sourceId: number) {
  const source = await db.select()
    .from(schema.quoteSources)
    .where(eq(schema.quoteSources.id, sourceId))
    .get()
  if (!source || source.quoteId !== quoteId) throwServer(404, 'Source not found')
  return source
}

export async function requireQuoteOccurrence(quoteId: number, occurrenceId: number) {
  const occurrence = await db.select()
    .from(schema.quoteOccurrences)
    .where(eq(schema.quoteOccurrences.id, occurrenceId))
    .get()
  if (!occurrence || occurrence.quoteId !== quoteId) throwServer(404, 'Occurrence not found')
  return occurrence
}

export async function requireAuthor(authorId: number | null | undefined) {
  if (authorId == null) return
  const author = await db.select({ id: schema.authors.id }).from(schema.authors).where(eq(schema.authors.id, authorId)).get()
  if (!author) throwServer(400, 'Invalid author ID')
}

export async function requireReference(referenceId: number | null | undefined) {
  if (referenceId == null) return
  const reference = await db.select({ id: schema.quoteReferences.id }).from(schema.quoteReferences).where(eq(schema.quoteReferences.id, referenceId)).get()
  if (!reference) throwServer(400, 'Invalid reference ID')
}

export async function requireAttributionForQuote(quoteId: number, attributionId: number | null | undefined) {
  if (attributionId == null) return
  await requireQuoteAttribution(quoteId, attributionId)
}

export async function requireOccurrenceForAttribution(quoteId: number, attributionId: number | null | undefined, occurrenceId: number | null | undefined) {
  if (occurrenceId == null) return
  const occurrence = await requireQuoteOccurrence(quoteId, occurrenceId)
  if (occurrence.attributionId !== null && attributionId !== null && attributionId !== undefined && occurrence.attributionId !== attributionId) throwServer(400, 'Occurrence does not belong to this attribution')
}
