import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { createQuoteSourceSchema } from '../../../../../validation/schemas'
import { requireAttributionForQuote, requireOccurrenceForAttribution, requireQuote } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { getAuditedBatchRow, runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({ openAPI: { summary: 'Create quote source', description: 'A source may be attached to this quote or one of its attributions. Changes are recorded in the editorial audit log.', tags: ['Quote provenance'], security: [{ apiKey: ['write:sources'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'write:sources')
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteSourceSchema.parse)
  await requireAttributionForQuote(quoteId, body.attribution_id)
  await requireOccurrenceForAttribution(quoteId, body.attribution_id, body.occurrence_id)

  const verified = body.verification_status !== 'unverified'
  const statements = []
  if (body.is_primary) {
    statements.push(db.update(schema.quoteSources).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteSources.quoteId, quoteId)))
  }
  statements.push(db.insert(schema.quoteSources).values({
    quoteId,
    attributionId: body.attribution_id,
    occurrenceId: body.occurrence_id,
    sourceType: body.source_type,
    sourceMedium: body.source_medium ?? null,
    sourceUrl: body.source_url || null,
    label: body.label || null,
    locatorType: body.locator_type ?? null,
    locatorValue: body.locator_value || null,
    translatorName: body.translator_name || null,
    verificationStatus: body.verification_status,
    notes: body.notes || null,
    isPrimary: body.is_primary,
    verifiedBy: verified ? api.userId : null,
    verifiedAt: verified ? new Date() : null,
    createdBy: api.userId,
  }).returning({ id: schema.quoteSources.id }))
  const results = await runApiAuditedBatch(event, api, statements)
  const created = getAuditedBatchRow<{ id: number }>(results, results.length - 2)

  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
