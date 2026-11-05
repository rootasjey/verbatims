import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { logActivity } from '~~/server/utils/activity-log'
import { runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'

defineRouteMeta({
  openAPI: {
    summary: 'Delete a quote',
    description: 'Deletes a quote. Users can only delete their own quotes; moderators and admins can delete any quote.',
    tags: ['Quotes'],
    security: [{ apiKey: ['delete:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Quote deleted' },
      '403': { description: 'Not authorized to delete this quote' },
      '404': { description: 'Quote not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'delete:quotes')

  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const quote = await db.select({
    id: schema.quotes.id,
    name: schema.quotes.name,
    userId: schema.quotes.userId,
    status: schema.quotes.status,
  })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const isMod = api.userRole === 'admin' || api.userRole === 'moderator'
  if (!isMod && quote!.userId !== api.userId) {
    throwServer(403, 'You can only delete your own quotes')
  }

  await logActivity(event, { type: 'quote_deleted', userId: api.userId, targetId: quoteId, targetType: 'quote', metadata: { status: quote.status, name: quote!.name } })

  await runApiAuditedBatch(event, api, [db.delete(schema.quotes).where(eq(schema.quotes.id, quoteId))])

  return {
    success: true,
    message: 'Quote deleted successfully',
  }
})
