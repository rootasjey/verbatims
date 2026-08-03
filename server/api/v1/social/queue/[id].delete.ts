import { deleteSocialQueueItem } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Remove social queue item',
    description: 'Deletes a single social queue item. Queued items are compacted after removal.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    parameters: [
      { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Queue item ID' },
    ],
    responses: {
      '200': { description: 'Item deleted' },
      '404': { description: 'Queue item not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const id = Number(getRouterParam(event, 'id'))
  const data = await deleteSocialQueueItem(id)

  return {
    success: true,
    data
  }
})
