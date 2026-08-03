import { getSocialQueueItem } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Get social queue item',
    description: 'Returns a single social queue item with its resolved quote content and latest post status.',
    tags: ['Social'],
    security: [{ apiKey: ['social:read'] }],
    parameters: [
      { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Queue item ID' },
    ],
    responses: {
      '200': { description: 'Queue item' },
      '404': { description: 'Queue item not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:read')

  const id = Number(getRouterParam(event, 'id'))
  const item = await getSocialQueueItem(id)

  return {
    success: true,
    data: item
  }
})
