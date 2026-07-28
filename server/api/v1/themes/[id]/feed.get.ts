import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get theme feed',
    description: 'Returns the full feed for a theme: matching quotes, authors, and references.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'language', in: 'query', schema: { type: 'string' }, description: 'Filter by language code' },
    ],
    responses: {
      '200': { description: 'Theme feed' },
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

  const theme = await db.select({ slug: schema.themes.slug })
    .from(schema.themes)
    .where(eq(schema.themes.id, themeId))
    .limit(1)
    .get()

  if (!theme) {
    throwServer(404, 'Theme not found')
  }

  const query = getQuery(event)
  const language = (query.language as string) || undefined

  const feed = await getThemeFeed(theme.slug, language)
  if (!feed) {
    throwServer(404, 'Theme feed not available')
  }

  setResponseHeader(event, 'Cache-Control', 'public, max-age=120')

  return { success: true, data: feed }
})
