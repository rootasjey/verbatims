import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Accept or reject a suggestion',
    description: 'Accepts or rejects an entity suggestion for a theme. On accept, creates the entity if it does not exist.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'sid', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['action'],
            properties: {
              action: { type: 'string', enum: ['accepted', 'rejected'] },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Suggestion updated' },
      '400': { description: 'Invalid action or already processed' },
      '404': { description: 'Suggestion not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'admin:themes')

  const id = getRouterParam(event, 'id')!
  const sid = getRouterParam(event, 'sid')!
  if (!id || isNaN(parseInt(id)) || !sid || isNaN(parseInt(sid))) {
    throwServer(400, 'Invalid theme ID or suggestion ID')
  }
  const themeId = parseInt(id)
  const suggestionId = parseInt(sid)

  const body = await readBody(event)
  const action: string = body?.action || ''
  if (!['accepted', 'rejected'].includes(action)) {
    throwServer(400, 'Action must be "accepted" or "rejected"')
  }

  const suggestion = await db.select()
    .from(schema.entitySuggestions)
    .where(eq(schema.entitySuggestions.id, suggestionId))
    .limit(1)
    .get()

  if (!suggestion) {
    throwServer(404, 'Suggestion not found')
  }
  if (suggestion.status !== 'pending') {
    throwServer(400, `Suggestion already ${suggestion.status}`)
  }

  if (action === 'accepted') {
    const value = suggestion.suggestedValue.trim()
    switch (suggestion.type) {
      case 'tag': {
        const existing = await db.select({ id: schema.tags.id })
          .from(schema.tags)
          .where(eq(schema.tags.name, value))
          .limit(1)
          .get()
        if (!existing) {
          await db.insert(schema.tags).values({ name: value })
        }
        break
      }
      case 'author': {
        const existing = await db.select({ id: schema.authors.id })
          .from(schema.authors)
          .where(eq(schema.authors.name, value))
          .limit(1)
          .get()
        if (!existing) {
          await db.insert(schema.authors).values({ name: value })
        }
        break
      }
      case 'reference': {
        const existing = await db.select({ id: schema.quoteReferences.id })
          .from(schema.quoteReferences)
          .where(eq(schema.quoteReferences.name, value))
          .limit(1)
          .get()
        if (!existing) {
          await db.insert(schema.quoteReferences).values({ name: value, primaryType: 'other' })
        }
        break
      }
    }
  }

  await db.update(schema.entitySuggestions)
    .set({
      status: action as any,
      reviewedBy: api.userId,
      reviewedAt: new Date(),
    })
    .where(eq(schema.entitySuggestions.id, suggestionId))

  return { success: true, data: { id: suggestionId, status: action } }
})
