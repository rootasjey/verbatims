import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteAttribution } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'

export default defineEventHandler(async (event) => {
  requireApiModerator(event.context.api)
  const quoteId = Number(getRouterParam(event, 'id'))
  const attributionId = Number(getRouterParam(event, 'aid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(attributionId)) throwServer(400, 'Invalid attribution ID')
  await requireQuoteAttribution(quoteId, attributionId)
  await db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.id, attributionId)).run()
  return { success: true, data: { id: attributionId, quote_id: quoteId } }
})
