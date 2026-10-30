import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateQuoteOccurrenceRequestSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireQuote, requireQuoteAttribution, requireQuoteOccurrence, requireReference } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event): Promise<{ success: true; data: { id: number; quote_id: number } }> => {
  await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, updateQuoteOccurrenceRequestSchema.parse)
  const current = await requireQuoteOccurrence(quoteId, body.occurrence_id)
  const attributionId = body.attribution_id !== undefined ? body.attribution_id : current.attributionId
  if (attributionId != null) await requireQuoteAttribution(quoteId, attributionId)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)

  await db.update(schema.quoteOccurrences).set({
    ...(body.attribution_id !== undefined ? { attributionId: body.attribution_id } : {}),
    ...(body.author_id !== undefined ? { authorId: body.author_id } : {}),
    ...(body.reference_id !== undefined ? { referenceId: body.reference_id } : {}),
    ...(body.occurrence_type !== undefined ? { occurrenceType: body.occurrence_type } : {}),
    ...(body.occurred_at !== undefined ? { occurredAt: body.occurred_at } : {}),
    ...(body.date_notes !== undefined ? { dateNotes: body.date_notes } : {}),
    ...(body.context !== undefined ? { context: body.context } : {}),
    ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    updatedAt: new Date(),
  }).where(eq(schema.quoteOccurrences.id, body.occurrence_id)).run()

  return { success: true, data: { id: body.occurrence_id, quote_id: quoteId } }
})
