import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteSource } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  const sourceId = Number(getRouterParam(event, 'sid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(sourceId)) throwServer(400, 'Invalid source ID')
  await requireQuoteSource(quoteId, sourceId)
  await db.delete(schema.quoteSources).where(eq(schema.quoteSources.id, sourceId)).run()
  return { success: true, data: { id: sourceId, quote_id: quoteId } }
})
