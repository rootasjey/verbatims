import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteSource } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({ openAPI: { summary: 'Delete quote source', tags: ['Quote provenance'], security: [{ apiKey: ['delete:sources'] }] } })

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'delete:sources')
  const quoteId = Number(getRouterParam(event, 'id'))
  const sourceId = Number(getRouterParam(event, 'sid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(sourceId)) throwServer(400, 'Invalid source ID')
  await requireQuoteSource(quoteId, sourceId)
  await runApiAuditedBatch(event, api, [db.delete(schema.quoteSources).where(eq(schema.quoteSources.id, sourceId))])
  return { success: true, data: { id: sourceId, quote_id: quoteId } }
})
