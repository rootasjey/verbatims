import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { updateQuoteProvenanceSchema } from '../../../../validation/schemas'
import { syncPrimaryAttribution, syncPrimarySource } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')

  const quote = await db.select({
    id: schema.quotes.id,
    authorId: schema.quotes.authorId,
    referenceId: schema.quotes.referenceId,
  })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const body = await readValidatedBody(event, updateQuoteProvenanceSchema.parse)
  const attributionId = await syncPrimaryAttribution(
    quoteId,
    body.author_id === undefined ? quote.authorId : body.author_id,
    body.reference_id === undefined ? quote.referenceId : body.reference_id,
    user.id,
  )

  if (body.attribution_status !== undefined || body.attribution_notes !== undefined) {
    await db.update(schema.quoteAttributions)
      .set({
        ...(body.attribution_status !== undefined ? { status: body.attribution_status } : {}),
        ...(body.attribution_notes !== undefined ? { notes: body.attribution_notes } : {}),
        verifiedBy: body.attribution_status && body.attribution_status !== 'unverified' ? user.id : null,
        verifiedAt: body.attribution_status && body.attribution_status !== 'unverified' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.quoteAttributions.id, attributionId), eq(schema.quoteAttributions.isPrimary, true)))
      .run()
  }

  if (body.source_type !== undefined || body.source_url !== undefined) {
    const sourceId = await syncPrimarySource(quoteId, attributionId, body.source_type, body.source_url, user.id)
    if (sourceId && (body.source_label !== undefined || body.source_verification_status !== undefined || body.source_notes !== undefined)) {
      await db.update(schema.quoteSources)
        .set({
          ...(body.source_label !== undefined ? { label: body.source_label } : {}),
          ...(body.source_verification_status !== undefined ? { verificationStatus: body.source_verification_status } : {}),
          ...(body.source_notes !== undefined ? { notes: body.source_notes } : {}),
          verifiedBy: body.source_verification_status && body.source_verification_status !== 'unverified' ? user.id : null,
          verifiedAt: body.source_verification_status && body.source_verification_status !== 'unverified' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.quoteSources.id, sourceId))
        .run()
    }
  }

  return { success: true, data: { quote_id: quoteId, attribution_id: attributionId } }
})
