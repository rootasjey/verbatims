import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Submit a quote for review',
    description: 'Submits a draft quote for moderation. Users can only submit their own quotes; moderators and admins can submit any quote. The quote becomes pending moderation.',
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Quote submitted for review' },
      '400': { description: 'Invalid quote ID or quote too short' },
      '403': { description: 'Not authorized to submit this quote' },
      '404': { description: 'Quote not found or not a draft' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const quote = await db.select()
    .from(schema.quotes)
    .where(and(
      eq(schema.quotes.id, quoteId),
      eq(schema.quotes.status, 'draft')
    ))
    .get()

  if (!quote) {
    throwServer(404, 'Quote not found or is not a draft')
  }

  const isMod = api.userRole === 'admin' || api.userRole === 'moderator'
  if (!isMod && quote.userId !== api.userId) {
    throwServer(403, 'You can only submit your own quotes for review')
  }

  await db.update(schema.quotes)
    .set({ status: 'pending', updatedAt: new Date() })
    .where(eq(schema.quotes.id, quoteId))
    .run()

  return {
    success: true,
    message: 'Quote submitted for moderation',
  }
})
