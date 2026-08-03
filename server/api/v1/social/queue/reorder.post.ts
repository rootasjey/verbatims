import { reorderSocialQueueItem } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Reorder social queue',
    description: 'Reorders a queued item either relative to another item (before_id) or by moving it up/down.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'integer', description: 'Queue item ID to move' },
              direction: { type: 'string', enum: ['up', 'down'], description: 'Legacy move direction' },
              before_id: { type: ['integer', 'null'], description: 'Place the item before this queue item ID, or null to move to the end' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Reorder result' },
      '404': { description: 'Queue item not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const body = await readBody(event)
  const data = await reorderSocialQueueItem({
    id: Number(body?.id),
    direction: body?.direction || '',
    beforeId: body?.before_id
  })

  return {
    success: true,
    data
  }
})
