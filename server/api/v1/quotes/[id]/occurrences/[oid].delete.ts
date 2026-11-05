import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireApiModerator } from '~~/server/utils/api-quote-provenance'
import { requireQuoteOccurrence } from '~~/server/utils/admin-quote-provenance'
import { runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({
  openAPI: {
    summary: 'Delete quote occurrence',
    description: 'Requires a moderator or admin account. The deletion is recorded in the editorial audit log.',
    tags: ['Quote provenance'],
    security: [{ apiKey: ['delete:occurrences'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'oid', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: { '200': { description: 'Occurrence deleted' }, '404': { description: 'Occurrence not found' } },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiModerator(api, 'delete:occurrences')
  const quoteId = Number(getRouterParam(event, 'id'))
  const occurrenceId = Number(getRouterParam(event, 'oid'))
  if (!Number.isInteger(quoteId) || quoteId <= 0 || !Number.isInteger(occurrenceId) || occurrenceId <= 0) throwServer(400, 'Invalid occurrence ID')
  await requireQuoteOccurrence(quoteId, occurrenceId)
  await runApiAuditedBatch(event, api, [db.delete(schema.quoteOccurrences).where(eq(schema.quoteOccurrences.id, occurrenceId))])
  return { success: true, data: { id: occurrenceId, quote_id: quoteId } }
})
