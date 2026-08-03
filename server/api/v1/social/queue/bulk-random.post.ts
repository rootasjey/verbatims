import { addRandomQuotesToQueue } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Enqueue random quotes',
    description: 'Enqueues N random approved quotes for a platform. Optionally filter by quote language.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['platform'],
            properties: {
              platform: { type: 'string', enum: ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'], default: 'x' },
              count: { type: 'integer', minimum: 1, maximum: 100, default: 5 },
              language: { type: 'string', nullable: true, description: 'Filter quotes by language code' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Queued items' },
      '400': { description: 'Invalid platform' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const body = await readBody(event)
  const inserted = await addRandomQuotesToQueue({
    platform: body?.platform || 'x',
    count: body?.count || 5,
    language: body?.language || '',
    createdBy: api.userId
  })

  return {
    success: true,
    data: inserted.map(item => ({
      id: item.id,
      quote_id: item.quoteId,
      source_type: item.sourceType,
      source_id: item.sourceId,
      position: item.position
    })),
    count: inserted.length
  }
})
