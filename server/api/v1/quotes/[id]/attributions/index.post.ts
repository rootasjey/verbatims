import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { createQuoteAttributionSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireReference, requireQuote } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { requireApiPermission } from '~~/server/utils/api-key'
import { getAuditedBatchRow, runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({ openAPI: { summary: 'Create quote attribution', description: 'Requires write:attributions and assign:authors and/or assign:references for supplied IDs. Requires a moderator or admin account. Changes are audited.', tags: ['Quote provenance'], security: [{ apiKey: ['write:attributions', 'assign:authors', 'assign:references'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'write:attributions')
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteAttributionSchema.parse)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)
  if (body.author_id != null) requireApiPermission(api, 'assign:authors')
  if (body.reference_id != null) requireApiPermission(api, 'assign:references')

  const existingPrimary = await db.select({ id: schema.quoteAttributions.id })
    .from(schema.quoteAttributions)
    .where(and(eq(schema.quoteAttributions.quoteId, quoteId), eq(schema.quoteAttributions.isPrimary, true)))
    .get()
  const isPrimary = body.is_primary || !existingPrimary

  const verified = body.status !== 'unverified'
  const statements = []
  if (isPrimary) {
    statements.push(db.update(schema.quoteAttributions).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteAttributions.quoteId, quoteId)))
  }
  statements.push(db.insert(schema.quoteAttributions).values({
    quoteId,
    authorId: body.author_id,
    referenceId: body.reference_id,
    isPrimary,
    status: body.status,
    notes: body.notes || null,
    verifiedBy: verified ? api.userId : null,
    verifiedAt: verified ? new Date() : null,
    createdBy: api.userId,
  }).returning({ id: schema.quoteAttributions.id }))
  const results = await runApiAuditedBatch(event, api, statements)
  const created = getAuditedBatchRow<{ id: number }>(results, results.length - 2)

  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
