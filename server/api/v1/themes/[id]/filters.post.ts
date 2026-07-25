import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { enrichThemeFilters } from '~~/server/utils/theme-enrichment'
import { scheduleBackground } from '~~/server/utils/schedule'

defineRouteMeta({
  openAPI: {
    summary: 'Add a filter to a theme',
    description: 'Adds a content filter to a theme (keyword, tag_name, author_name, reference_name, author_id, reference_id).',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: { type: 'string', enum: ['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id'] },
              value: { type: 'string' },
              match_mode: { type: 'string', enum: ['any', 'all'], default: 'any' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Filter added' },
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
  const body = await readBody(event)

  const type = body?.type as string
  const value = String(body?.value || '').trim()
  const matchMode = body?.match_mode || 'any'

  const validTypes = ['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id']
  if (!type || !validTypes.includes(type)) {
    throwServer(400, `Invalid filter type. Must be one of: ${validTypes.join(', ')}`)
  }
  if (!value || value.length < 1) {
    throwServer(400, 'Filter value is required')
  }

  const theme = await db.select({ id: schema.themes.id })
    .from(schema.themes)
    .where(eq(schema.themes.id, themeId))
    .limit(1)

  if (!theme || theme.length === 0) {
    throwServer(404, 'Theme not found')
  }

  await db.run(sql`
    INSERT INTO theme_content_filters (theme_id, type, value, match_mode)
    VALUES (${themeId}, ${type}, ${value}, ${matchMode})
  `)

  scheduleBackground(event, enrichThemeFilters(themeId, api.userId))

  return { success: true, data: { themeId, type, value, matchMode } }
})
