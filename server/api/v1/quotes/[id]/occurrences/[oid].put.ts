import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateQuoteOccurrenceSchema } from '../../../../../validation/schemas'
import { requireApiPermission } from '~~/server/utils/api-key'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { requireAttributionForQuote, requireAuthor, requireQuoteOccurrence, requireReference } from '~~/server/utils/admin-quote-provenance'
import { runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({
  openAPI: {
    summary: 'Update quote occurrence',
    description: 'Requires a moderator or admin account. Changing author_id or reference_id requires its respective assignment scope. Changes are audited.',
    tags: ['Quote provenance'],
    security: [{ apiKey: ['write:occurrences'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'oid', in: 'path', required: true, schema: { type: 'integer' } },
    ],
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
    responses: { '200': { description: 'Occurrence updated' }, '404': { description: 'Occurrence not found' } },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'write:occurrences')
  const quoteId = Number(getRouterParam(event, 'id'))
  const occurrenceId = Number(getRouterParam(event, 'oid'))
  if (!Number.isInteger(quoteId) || quoteId <= 0 || !Number.isInteger(occurrenceId) || occurrenceId <= 0) throwServer(400, 'Invalid occurrence ID')
  const occurrence = await requireQuoteOccurrence(quoteId, occurrenceId)
  const body = await readValidatedBody(event, updateQuoteOccurrenceSchema.parse)
  const attributionId = body.attribution_id !== undefined ? body.attribution_id : occurrence.attributionId
  const authorId = body.author_id !== undefined ? body.author_id : occurrence.authorId
  const referenceId = body.reference_id !== undefined ? body.reference_id : occurrence.referenceId
  await requireAttributionForQuote(quoteId, attributionId)
  await requireAuthor(authorId)
  await requireReference(referenceId)
  if (body.author_id !== undefined && body.author_id !== occurrence.authorId) requireApiPermission(api, 'assign:authors')
  if (body.reference_id !== undefined && body.reference_id !== occurrence.referenceId) requireApiPermission(api, 'assign:references')

  await runApiAuditedBatch(event, api, [db.update(schema.quoteOccurrences).set({
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
  }).where(eq(schema.quoteOccurrences.id, occurrenceId))])
  return { success: true, data: { id: occurrenceId, quote_id: quoteId } }
})
