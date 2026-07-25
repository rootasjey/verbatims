import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List theme entity suggestions',
    description: 'Returns pending entity suggestions (tags, authors, references) for a theme.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'List of suggestions' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'admin:themes')

  const id = getRouterParam(event, 'id')!
  if (!id || isNaN(parseInt(id))) {
    throwServer(400, 'Invalid theme ID')
  }
  const themeId = parseInt(id)

  const rows = await db.select()
    .from(schema.entitySuggestions)
    .where(eq(schema.entitySuggestions.themeId, themeId))
    .orderBy(schema.entitySuggestions.createdAt)
    .all()

  return { success: true, data: rows }
})
