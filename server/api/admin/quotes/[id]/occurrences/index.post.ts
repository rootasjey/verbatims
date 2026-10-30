import { db, schema } from 'hub:db'
import { createQuoteOccurrenceSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireQuote, requireQuoteAttribution, requireReference } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event): Promise<{ success: true; data: { id: number; quote_id: number } }> => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteOccurrenceSchema.parse)
  if (body.attribution_id !== null) await requireQuoteAttribution(quoteId, body.attribution_id)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)

  const created = await db.insert(schema.quoteOccurrences).values({
    quoteId,
    attributionId: body.attribution_id,
    authorId: body.author_id,
    referenceId: body.reference_id,
    occurrenceType: body.occurrence_type,
    occurredAt: body.occurred_at,
    dateNotes: body.date_notes,
    context: body.context,
    excerpt: body.excerpt,
    notes: body.notes,
    createdBy: user.id,
  }).returning({ id: schema.quoteOccurrences.id }).get()

  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
