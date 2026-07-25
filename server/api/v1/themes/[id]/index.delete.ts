import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Delete a theme',
    description: 'Deletes a theme permanently.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Theme deleted' },
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

  const existing = await db.select({ id: schema.themes.id })
    .from(schema.themes)
    .where(eq(schema.themes.id, themeId))
    .limit(1)

  if (!existing || existing.length === 0) {
    throwServer(404, 'Theme not found')
  }

  await db.delete(schema.themes).where(eq(schema.themes.id, themeId))

  return { success: true, data: { deleted: true } }
})
