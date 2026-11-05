import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteAttribution } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({ openAPI: { summary: 'Delete quote attribution', tags: ['Quote provenance'], security: [{ apiKey: ['delete:attributions'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'delete:attributions')
  const quoteId = Number(getRouterParam(event, 'id'))
  const attributionId = Number(getRouterParam(event, 'aid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(attributionId)) throwServer(400, 'Invalid attribution ID')
  const attribution = await requireQuoteAttribution(quoteId, attributionId)
  if (attribution.isPrimary) {
    throwServer(400, 'Choose another primary attribution before deleting this one')
  }
  await runApiAuditedBatch(event, api, [db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.id, attributionId))])
  return { success: true, data: { id: attributionId, quote_id: quoteId } }
})
