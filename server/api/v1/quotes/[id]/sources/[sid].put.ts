import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateQuoteSourceSchema } from '../../../../../validation/schemas'
import { requireAttributionForQuote, requireOccurrenceForAttribution, requireQuoteSource } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'

defineRouteMeta({ openAPI: { summary: 'Update quote source', tags: ['Quote provenance'], security: [{ apiKey: ['write:quotes'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api)
  const quoteId = Number(getRouterParam(event, 'id'))
  const sourceId = Number(getRouterParam(event, 'sid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(sourceId)) throwServer(400, 'Invalid source ID')
  const body = await readValidatedBody(event, updateQuoteSourceSchema.parse)
  const current = await requireQuoteSource(quoteId, sourceId)
  const attributionId = body.attribution_id !== undefined ? body.attribution_id : current.attributionId
  await requireAttributionForQuote(quoteId, attributionId)
  await requireOccurrenceForAttribution(quoteId, attributionId, body.occurrence_id ?? current.occurrenceId)

  if (body.is_primary) {
    await db.update(schema.quoteSources).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteSources.quoteId, quoteId)).run()
  }

  const verified = body.verification_status !== undefined && body.verification_status !== 'unverified'
  await db.update(schema.quoteSources).set({
    ...(body.attribution_id !== undefined ? { attributionId: body.attribution_id } : {}),
    ...(body.occurrence_id !== undefined ? { occurrenceId: body.occurrence_id } : {}),
    ...(body.source_type !== undefined ? { sourceType: body.source_type } : {}),
    ...(body.source_url !== undefined ? { sourceUrl: body.source_url } : {}),
    ...(body.label !== undefined ? { label: body.label } : {}),
    ...(body.translator_name !== undefined ? { translatorName: body.translator_name } : {}),
    ...(body.verification_status !== undefined ? { verificationStatus: body.verification_status, verifiedBy: verified ? api.userId : null, verifiedAt: verified ? new Date() : null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    ...(body.is_primary !== undefined ? { isPrimary: body.is_primary } : {}),
    updatedAt: new Date(),
  }).where(eq(schema.quoteSources.id, sourceId)).run()

  return { success: true, data: { id: sourceId, quote_id: quoteId } }
})
