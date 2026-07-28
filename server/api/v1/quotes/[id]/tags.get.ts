import { db, schema } from 'hub:db'
import { eq, asc } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List quote tags',
    description: 'Returns all tags attached to a quote.',
    tags: ['Quotes'],
    security: [{ apiKey: ['read'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'List of tags' },
      '404': { description: 'Quote not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'user', 'moderator', 'admin')

  const quoteId = getRouterParam(event, 'id')!
  if (!quoteId || isNaN(parseInt(quoteId))) {
    throwServer(400, 'Invalid quote ID')
  }

  const quote = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .limit(1)
    .get()

  if (!quote) {
    throwServer(404, 'Quote not found')
  }

  const tags = await db.select({
    id: schema.tags.id,
    name: schema.tags.name,
    color: schema.tags.color,
  })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId)))
    .orderBy(asc(schema.tags.name))
    .all()

  return { success: true, data: tags }
})
