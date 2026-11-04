import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { createQuoteAttributionSchema } from '../../../../../validation/schemas'
import { requireAuthor, requireReference, requireQuote } from '~~/server/utils/admin-quote-provenance'
import { getAuditedBatchRow, runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readValidatedBody(event, createQuoteAttributionSchema.parse)
  await requireAuthor(body.author_id)
  await requireReference(body.reference_id)

  const existingPrimary = await db.select({ id: schema.quoteAttributions.id })
    .from(schema.quoteAttributions)
    .where(and(eq(schema.quoteAttributions.quoteId, quoteId), eq(schema.quoteAttributions.isPrimary, true)))
    .get()
  const isPrimary = body.is_primary || !existingPrimary

  const verified = body.status !== 'unverified'
  const statements = []
  if (isPrimary) statements.push(db.update(schema.quoteAttributions).set({ isPrimary: false, updatedAt: new Date() }).where(eq(schema.quoteAttributions.quoteId, quoteId)))
  statements.push(db.insert(schema.quoteAttributions).values({
    quoteId,
    authorId: body.author_id,
    referenceId: body.reference_id,
    isPrimary,
    status: body.status,
    notes: body.notes || null,
    verifiedBy: verified ? user.id : null,
    verifiedAt: verified ? new Date() : null,
    createdBy: user.id,
  }).returning({ id: schema.quoteAttributions.id }))
  const results = await runWebEditorialAuditedBatch(event, user.id, statements)
  const created = getAuditedBatchRow<{ id: number }>(results, results.length - 2)

  return { success: true, data: { id: created.id, quote_id: quoteId } }
})
