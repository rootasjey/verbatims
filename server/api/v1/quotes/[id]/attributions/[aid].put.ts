import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateQuoteAttributionSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireReference, requireQuoteAttribution } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'

defineRouteMeta({ openAPI: { summary: 'Update quote attribution', tags: ['Quote provenance'], security: [{ apiKey: ['write:quotes'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api)
  const quoteId = Number(getRouterParam(event, 'id'))
  const attributionId = Number(getRouterParam(event, 'aid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(attributionId)) throwServer(400, 'Invalid attribution ID')
  const attribution = await requireQuoteAttribution(quoteId, attributionId)
  const body = await readValidatedBody(event, updateQuoteAttributionSchema.parse)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)

  if (body.is_primary === false && attribution.isPrimary) {
    throwServer(400, 'Choose another primary attribution before unsetting this one')
  }

  if (body.is_primary) {
    await db.update(schema.quoteAttributions).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteAttributions.quoteId, quoteId)).run()
  }

  const verified = body.status !== undefined && body.status !== 'unverified'
  await db.update(schema.quoteAttributions).set({
    ...(body.author_id !== undefined ? { authorId: body.author_id } : {}),
    ...(body.reference_id !== undefined ? { referenceId: body.reference_id } : {}),
    ...(body.is_primary !== undefined ? { isPrimary: body.is_primary } : {}),
    ...(body.status !== undefined ? { status: body.status, verifiedBy: verified ? api.userId : null, verifiedAt: verified ? new Date() : null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    updatedAt: new Date(),
  }).where(eq(schema.quoteAttributions.id, attributionId)).run()

  return { success: true, data: { id: attributionId, quote_id: quoteId } }
})
