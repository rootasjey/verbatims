import { listSocialPlatforms } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'List social platforms',
    description: 'Returns the supported social platforms with their enabled status and per-platform queue stats.',
    tags: ['Social'],
    security: [{ apiKey: ['social:read'] }],
    responses: {
      '200': {
        description: 'Platform statuses',
        content: {
          'application/json': {
            example: {
              success: true,
              data: [
                { platform: 'x', label: 'X', enabled: true, queue: { queued: 3, processing: 0, posted: 12, failed: 1 } },
              ],
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:read')

  const platforms = await listSocialPlatforms()

  return {
    success: true,
    data: platforms
  }
})
