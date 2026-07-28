import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List theme filters',
    description: 'Returns all content filters for a theme.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'List of filters' },
      '404': { description: 'Theme not found' },
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

  const theme = await db.select({ id: schema.themes.id })
    .from(schema.themes)
    .where(eq(schema.themes.id, themeId))
    .limit(1)
    .get()

  if (!theme) {
    throwServer(404, 'Theme not found')
  }

  const filters = await db.select()
    .from(schema.themeContentFilters)
    .where(eq(schema.themeContentFilters.themeId, themeId))
    .all()

  return { success: true, data: filters }
})
