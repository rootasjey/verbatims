import { listSocialQueue } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

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
