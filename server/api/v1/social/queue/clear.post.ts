import { clearSocialQueue } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'Clear social queue',
    description: 'Deletes queue items for a platform. Requires confirm: true. Use scope "all" to empty the queue or "finished" to remove only posted and failed items.',
    tags: ['Social'],
    security: [{ apiKey: ['social:write'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['platform', 'confirm'],
            properties: {
              platform: { type: 'string', enum: ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'] },
              confirm: { type: 'boolean', description: 'Must be true to clear the queue' },
              scope: { type: 'string', enum: ['all', 'finished'], default: 'all' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Clear result' },
      '400': { description: 'Confirmation or invalid platform/scope' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:write')

  const body = await readBody(event)
  const data = await clearSocialQueue({
    platform: String(body?.platform || '').trim(),
    confirm: Boolean(body?.confirm),
    scope: body?.scope === 'finished' ? 'finished' : 'all'
  })

  return {
    success: true,
    data
  }
})
