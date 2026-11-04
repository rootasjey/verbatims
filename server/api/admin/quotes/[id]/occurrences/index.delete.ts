import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuote, requireQuoteOccurrence } from '~~/server/utils/admin-quote-provenance'
import { runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'

export default defineEventHandler(async (event): Promise<{ success: true; data: { id: number; quote_id: number } }> => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId <= 0) throwServer(400, 'Invalid quote ID')
  await requireQuote(quoteId)
  const body = await readBody<{ occurrence_id?: number }>(event)
  if (!Number.isInteger(body?.occurrence_id) || Number(body.occurrence_id) <= 0) throwServer(400, 'Invalid occurrence ID')
  await requireQuoteOccurrence(quoteId, Number(body.occurrence_id))
  await runWebEditorialAuditedBatch(event, user.id, [db.delete(schema.quoteOccurrences).where(eq(schema.quoteOccurrences.id, Number(body.occurrence_id)))])
  return { success: true, data: { id: Number(body.occurrence_id), quote_id: quoteId } }
})
