import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get a theme',
    description: 'Returns a single theme with its filters and translations.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Theme details' },
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

  const theme = await db.select()
    .from(schema.themes)
    .where(eq(schema.themes.id, themeId))
    .limit(1)
    .get()

  if (!theme) {
    throwServer(404, 'Theme not found')
  }

  const [filters, translations] = await Promise.all([
    db.select()
      .from(schema.themeContentFilters)
      .where(eq(schema.themeContentFilters.themeId, themeId))
      .all(),
    db.select()
      .from(schema.themeTranslations)
      .where(eq(schema.themeTranslations.themeId, themeId))
      .all(),
  ])

  return {
    success: true,
    data: { ...theme, filters, translations },
  }
})
