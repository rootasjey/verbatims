import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateQuoteAttributionSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireReference, requireQuoteAttribution } from '~~/server/utils/admin-quote-provenance'
import { runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  const attributionId = Number(getRouterParam(event, 'aid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(attributionId)) throwServer(400, 'Invalid attribution ID')
  const attribution = await requireQuoteAttribution(quoteId, attributionId)
  const body = await readValidatedBody(event, updateQuoteAttributionSchema.parse)
  const authorId = body.author_id !== undefined ? body.author_id : attribution.authorId
  const referenceId = body.reference_id !== undefined ? body.reference_id : attribution.referenceId
  if (authorId == null && referenceId == null) throwServer(400, 'An attribution requires an author or reference')
  await requireAuthor(authorId)
  await requireReference(referenceId)

  if (body.is_primary === false && attribution.isPrimary) {
    throwServer(400, 'Choose another primary attribution before unsetting this one')
  }

  const verified = body.status !== undefined && body.status !== 'unverified'
  const statements = []
  if (body.is_primary) statements.push(db.update(schema.quoteAttributions).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteAttributions.quoteId, quoteId)))
  statements.push(db.update(schema.quoteAttributions).set({
    ...(body.author_id !== undefined ? { authorId: body.author_id } : {}),
    ...(body.reference_id !== undefined ? { referenceId: body.reference_id } : {}),
    ...(body.is_primary !== undefined ? { isPrimary: body.is_primary } : {}),
    ...(body.status !== undefined ? { status: body.status, verifiedBy: verified ? user.id : null, verifiedAt: verified ? new Date() : null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    updatedAt: new Date(),
  }).where(eq(schema.quoteAttributions.id, attributionId)))
  await runWebEditorialAuditedBatch(event, user.id, statements)

  return { success: true, data: { id: attributionId, quote_id: quoteId } }
})
