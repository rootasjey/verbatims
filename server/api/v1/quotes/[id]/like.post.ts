import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { toggleLike } from '../../../../services/like.service'

defineRouteMeta({
  openAPI: {
    summary: 'Toggle like on a quote',
    description: 'Likes or unlikes an approved quote. Returns the new like state and updated count.',
    tags: ['Quotes'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Like toggled' },
      '404': { description: 'Quote not found or not approved' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const quote = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(and(eq(schema.quotes.id, quoteId), eq(schema.quotes.status, 'approved')))
    .get()

  if (!quote) throwServer(404, 'Quote not found or not approved')

  const result = await toggleLike('quote', quoteId, api.userId)

  return { success: true, data: result }
})
