import { db, schema } from 'hub:db'
import { createQuoteOccurrenceSchema } from '../../../../../validation/schemas'
import { requireApiPermission } from '~~/server/utils/api-key'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { requireAttributionForQuote, requireAuthor, requireQuote, requireReference } from '~~/server/utils/admin-quote-provenance'
import { getAuditedBatchRow, runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({
  openAPI: {
    summary: 'Create quote occurrence',
    description: 'Requires a moderator or admin account. author_id and reference_id require their respective assignment scopes. Changes are audited.',
    tags: ['Quote provenance'],
    security: [{ apiKey: ['write:occurrences'] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              attribution_id: { type: 'integer', nullable: true },
              author_id: { type: 'integer', nullable: true },
              reference_id: { type: 'integer', nullable: true },
              occurrence_type: { type: 'string', enum: ['origin', 'quotation', 'adaptation', 'performance', 'other'] },
              occurred_at: { type: 'string', nullable: true },
              date_notes: { type: 'string', nullable: true },
              context: { type: 'string', nullable: true },
              excerpt: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    responses: { '200': { description: 'Occurrence created' }, '400': { description: 'Invalid quote or provenance IDs' } },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'write:occurrences')
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteOccurrenceSchema.parse)
  await requireAttributionForQuote(quoteId, body.attribution_id)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)
  if (body.author_id != null) requireApiPermission(api, 'assign:authors')
  if (body.reference_id != null) requireApiPermission(api, 'assign:references')

  const results = await runApiAuditedBatch(event, api, [db.insert(schema.quoteOccurrences).values({
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
    createdBy: api.userId,
  }).returning({ id: schema.quoteOccurrences.id })])
  const created = getAuditedBatchRow<{ id: number }>(results, 1)
  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
