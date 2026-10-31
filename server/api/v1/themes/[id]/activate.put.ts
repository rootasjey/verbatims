import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Toggle homepage theme selection',
    description: 'Selects or deselects a theme for homepage fallback. home_is_active is preferred; is_active remains supported for compatibility.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Status toggled' },
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
  const homeIsActive = body?.home_is_active === undefined
    ? body?.is_active === true
    : body.home_is_active === true

  await db.update(schema.themes)
    .set({ homeIsActive, isActive: homeIsActive })
    .where(eq(schema.themes.id, themeId))

  return {
    success: true,
    data: {
      id: themeId,
      homeIsActive,
      home_is_active: homeIsActive,
      isActive: homeIsActive,
      is_active: homeIsActive,
    },
  }
})
