import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Delete a theme filter',
    description: 'Removes a content filter from a theme.',
    tags: ['Themes'],
    security: [{ apiKey: ['admin:themes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'fid', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Filter deleted' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'admin:themes')

  const id = getRouterParam(event, 'id')!
  const fid = getRouterParam(event, 'fid')!
  if (!id || isNaN(parseInt(id)) || !fid || isNaN(parseInt(fid))) {
    throwServer(400, 'Invalid theme ID or filter ID')
  }
  const themeId = parseInt(id)
  const filterId = parseInt(fid)

  await db.delete(schema.themeContentFilters)
    .where(and(
      eq(schema.themeContentFilters.id, filterId),
      eq(schema.themeContentFilters.themeId, themeId)
    ))

  return { success: true, data: { deleted: true } }
})
