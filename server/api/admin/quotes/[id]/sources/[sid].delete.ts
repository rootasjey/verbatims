import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteSource } from '~~/server/utils/admin-quote-provenance'
import { runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  const sourceId = Number(getRouterParam(event, 'sid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(sourceId)) throwServer(400, 'Invalid source ID')
  await requireQuoteSource(quoteId, sourceId)
  await runWebEditorialAuditedBatch(event, user.id, [db.delete(schema.quoteSources).where(eq(schema.quoteSources.id, sourceId))])
  return { success: true, data: { id: sourceId, quote_id: quoteId } }
})
