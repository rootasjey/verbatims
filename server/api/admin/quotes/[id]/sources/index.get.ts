import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuote } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const data = await db.select({
    id: schema.quoteSources.id,
    quote_id: schema.quoteSources.quoteId,
    attribution_id: schema.quoteSources.attributionId,
    occurrence_id: schema.quoteSources.occurrenceId,
    source_type: schema.quoteSources.sourceType,
    source_url: schema.quoteSources.sourceUrl,
    label: schema.quoteSources.label,
    translator_name: schema.quoteSources.translatorName,
    verification_status: schema.quoteSources.verificationStatus,
    verified_by: schema.quoteSources.verifiedBy,
    verified_at: schema.quoteSources.verifiedAt,
    notes: schema.quoteSources.notes,
    is_primary: schema.quoteSources.isPrimary,
  }).from(schema.quoteSources)
    .where(eq(schema.quoteSources.quoteId, quoteId)).all()
  return { success: true, data }
})
