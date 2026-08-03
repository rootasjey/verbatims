import { addQuotesToQueue } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Add quotes to social queue',
    description: 'Adds approved quotes to the social queue for a platform. Optionally schedule them for a future publish time.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['quote_ids', 'platform'],
            properties: {
              quote_ids: { type: 'array', items: { type: 'integer' }, minItems: 1, maxItems: 200, description: 'Approved quote IDs to enqueue' },
              platform: { type: 'string', enum: ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'], default: 'x' },
              scheduled_for: { type: 'string', format: 'date-time', nullable: true, description: 'Optional future publish time (ISO 8601)' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Queued items' },
      '400': { description: 'Validation error or no valid quotes' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const body = await readBody(event)
  const inserted = await addQuotesToQueue({
    quoteIds: body?.quote_ids,
    platform: body?.platform || 'x',
    scheduledFor: body?.scheduled_for ?? null,
    createdBy: api.userId
  })

  return {
    success: true,
    data: inserted.map(item => ({
      id: item.id,
      quote_id: item.quoteId,
      source_type: item.sourceType,
      source_id: item.sourceId,
      position: item.position,
      status: item.status
    })),
    count: inserted.length
  }
})
