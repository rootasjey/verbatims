import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Remove a tag from a quote',
    description: 'Detaches a tag from a quote.',
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'tagId', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Tag removed' },
      '403': { description: 'Not allowed' },
      '404': { description: 'Quote not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'user', 'moderator', 'admin')
  requireApiPermission(api, 'write:quotes')

  const quoteId = getRouterParam(event, 'id')!
  const tagId = getRouterParam(event, 'tagId')!
  if (!quoteId || isNaN(parseInt(quoteId)) || !tagId || isNaN(parseInt(tagId))) {
    throwServer(400, 'Invalid identifiers')
  }

  const quote = await db.select({
    userId: schema.quotes.userId,
    status: schema.quotes.status,
  })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const isPrivileged = api.role === 'admin' || api.role === 'moderator'
  const isOwnerDraft = quote.userId === api.userId && quote.status === 'draft'
  if (!isPrivileged && !isOwnerDraft) {
    throwServer(403, 'Not allowed to edit tags for this quote')
  }

  await db.delete(schema.quoteTags)
    .where(and(
      eq(schema.quoteTags.quoteId, parseInt(quoteId)),
      eq(schema.quoteTags.tagId, parseInt(tagId)),
    ))
    .run()

  return { success: true }
})
