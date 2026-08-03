import { requeueSocialQueueItem } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Requeue social queue item',
    description: 'Resets a failed queue item back to queued so it can be published again.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    parameters: [
      { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Queue item ID' },
    ],
    responses: {
      '200': { description: 'Item requeued' },
      '400': { description: 'Item is not failed' },
      '404': { description: 'Queue item not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const id = Number(getRouterParam(event, 'id'))
  const data = await requeueSocialQueueItem(id)

  return {
    success: true,
    data
  }
})
