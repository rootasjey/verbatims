import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireQuoteSource } from '~~/server/utils/admin-quote-provenance'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'

defineRouteMeta({ openAPI: { summary: 'Delete quote source', tags: ['Quote provenance'], security: [{ apiKey: ['write:quotes'] }] } })

export default defineEventHandler(async (event) => {
  requireApiModerator(event.context.api)
  const quoteId = Number(getRouterParam(event, 'id'))
  const sourceId = Number(getRouterParam(event, 'sid'))
  if (!Number.isInteger(quoteId) || !Number.isInteger(sourceId)) throwServer(400, 'Invalid source ID')
  await requireQuoteSource(quoteId, sourceId)
  await db.delete(schema.quoteSources).where(eq(schema.quoteSources.id, sourceId)).run()
  return { success: true, data: { id: sourceId, quote_id: quoteId } }
})
