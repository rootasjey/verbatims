import { listSocialQueue } from '~~/server/utils/social-queue-api'
import { requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'

defineRouteMeta({
  openAPI: {
    summary: 'List social queue',
    description: 'Paginated list of the social queue for a platform, with status filters, search, and per-item resolved quote content.',
    tags: ['Social'],
    security: [{ apiKey: ['social:read'] }],
    parameters: [
      { in: 'query', name: 'platform', schema: { type: 'string', enum: ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'], default: 'x' }, description: 'Social platform' },
      { in: 'query', name: 'status', schema: { type: 'string', enum: ['queued', 'processing', 'posted', 'failed', 'active'] }, description: 'Filter by queue status' },
      { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by quote text, author, reference, or source' },
      { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
    ],
    responses: {
      '200': { description: 'Queue items with stats' },
      '400': { description: 'Invalid platform or status' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'social:read')

  const query = getQuery(event)
  const data = await listSocialQueue({
    page: typeof query.page === 'string' ? query.page : undefined,
    limit: typeof query.limit === 'string' ? query.limit : undefined,
    search: typeof query.search === 'string' ? query.search : undefined,
    status: typeof query.status === 'string' ? query.status : undefined,
    platform: typeof query.platform === 'string' ? query.platform : undefined
  })

  return {
    success: true,
    data: {
      queue: data.queue,
      stats: data.stats
    },
    pagination: data.pagination
  }
})
