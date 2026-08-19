import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteAttribution } from '~~/server/utils/admin-quote-provenance'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  const attributionId = Number(getRouterParam(event, 'aid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(attributionId)) throwServer(400, 'Invalid attribution ID')
  const attribution = await requireQuoteAttribution(quoteId, attributionId)
  if (attribution.isPrimary) {
    throwServer(400, 'Choose another primary attribution before deleting this one')
  }
  await db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.id, attributionId)).run()
  return { success: true, data: { id: attributionId, quote_id: quoteId } }
})
