import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { createQuoteAttributionSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireReference, requireQuote } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'

defineRouteMeta({ openAPI: { summary: 'Create quote attribution', tags: ['Quote provenance'], security: [{ apiKey: ['write:quotes'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteAttributionSchema.parse)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)

  if (body.is_primary) {
    await db.update(schema.quoteAttributions).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteAttributions.quoteId, quoteId)).run()
  }

  const verified = body.status !== 'unverified'
  const created = await db.insert(schema.quoteAttributions).values({
    quoteId,
    authorId: body.author_id,
    referenceId: body.reference_id,
    isPrimary: body.is_primary,
    status: body.status,
    notes: body.notes || null,
    verifiedBy: verified ? api.userId : null,
    verifiedAt: verified ? new Date() : null,
    createdBy: api.userId,
  }).returning({ id: schema.quoteAttributions.id }).get()

  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
