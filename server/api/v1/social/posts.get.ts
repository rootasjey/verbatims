import { listSocialPosts } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'List social posts',
    description: 'Paginated audit trail of published social posts (successes and failures), optionally filtered by platform and status.',
    tags: ['Social'],
    security: [{ apiKey: ['social:read'] }],
    parameters: [
      { in: 'query', name: 'platform', schema: { type: 'string', enum: ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'] }, description: 'Filter by platform' },
      { in: 'query', name: 'status', schema: { type: 'string', enum: ['success', 'failed'] }, description: 'Filter by post status' },
      { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
    ],
    responses: {
      '200': { description: 'Posts with pagination' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:read')

  const query = getQuery(event)
  const data = await listSocialPosts({
    page: typeof query.page === 'string' ? query.page : undefined,
    limit: typeof query.limit === 'string' ? query.limit : undefined,
    platform: typeof query.platform === 'string' ? query.platform : undefined,
    status: typeof query.status === 'string' ? query.status : undefined
  })

  return {
    success: true,
    data: {
      posts: data.posts
    },
    pagination: data.pagination
  }
})
