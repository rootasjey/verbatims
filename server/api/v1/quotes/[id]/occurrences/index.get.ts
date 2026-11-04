import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireApiQuoteReadAccess } from '~~/server/utils/api-quote-provenance'
import { requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'List quote occurrences',
    description: 'Lists occurrences attached to the quote. Requires read:provenance.',
    tags: ['Quote provenance'],
    security: [{ apiKey: ['read:provenance'] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    responses: { '200': { description: 'Quote occurrences' }, '404': { description: 'Quote not found' } },
  },
})

export default defineEventHandler(async (event) => {
  requireApiPermission(event.context.api, 'read:provenance')
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireApiQuoteReadAccess(event.context.api, quoteId)

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
    created_at: schema.quoteOccurrences.createdAt,
    updated_at: schema.quoteOccurrences.updatedAt,
  }).from(schema.quoteOccurrences).where(eq(schema.quoteOccurrences.quoteId, quoteId)).all()

  return { success: true, data }
})
