import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { createQuoteSourceSchema } from '../../../../../validation/schemas'
import { requireAttributionForQuote, requireQuote } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteSourceSchema.parse)
  await requireAttributionForQuote(quoteId, body.attribution_id)

  if (body.is_primary) {
    await db.update(schema.quoteSources).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteSources.quoteId, quoteId)).run()
  }

  const verified = body.verification_status !== 'unverified'
  const created = await db.insert(schema.quoteSources).values({
    quoteId,
    attributionId: body.attribution_id,
    sourceType: body.source_type,
    sourceUrl: body.source_url || null,
    label: body.label || null,
    verificationStatus: body.verification_status,
    notes: body.notes || null,
    isPrimary: body.is_primary,
    verifiedBy: verified ? user.id : null,
    verifiedAt: verified ? new Date() : null,
    createdBy: user.id,
  }).returning({ id: schema.quoteSources.id }).get()

  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
