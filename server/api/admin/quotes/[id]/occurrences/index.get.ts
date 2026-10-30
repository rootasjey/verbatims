import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireQuote } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event): Promise<{ success: true; data: unknown }> => {
  await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)

  const data = await db.select({
    id: schema.quoteOccurrences.id,
    quote_id: schema.quoteOccurrences.quoteId,
    attribution_id: schema.quoteOccurrences.attributionId,
    author_id: schema.quoteOccurrences.authorId,
    reference_id: schema.quoteOccurrences.referenceId,
    occurrence_type: schema.quoteOccurrences.occurrenceType,
    occurred_at: schema.quoteOccurrences.occurredAt,
    date_notes: schema.quoteOccurrences.dateNotes,
    context: schema.quoteOccurrences.context,
    excerpt: schema.quoteOccurrences.excerpt,
    notes: schema.quoteOccurrences.notes,
    author_name: schema.authors.name,
    reference_name: schema.quoteReferences.name,
  })
    .from(schema.quoteOccurrences)
    .leftJoin(schema.authors, eq(schema.quoteOccurrences.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quoteOccurrences.referenceId, schema.quoteReferences.id))
    .where(eq(schema.quoteOccurrences.quoteId, quoteId))
    .all()

  return {
    success: true,
    data: data.map(({ author_name, reference_name, ...occurrence }) => ({
      ...occurrence,
      author: occurrence.author_id && author_name ? { id: occurrence.author_id, name: author_name } : null,
      reference: occurrence.reference_id && reference_name ? { id: occurrence.reference_id, name: reference_name } : null,
    })),
  }
})
