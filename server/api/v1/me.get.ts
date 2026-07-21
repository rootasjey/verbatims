import { kv } from 'hub:kv'

defineRouteMeta({
  openAPI: {
    summary: 'Current API key info',
    description: 'Returns details about the authenticated API key including rate limits.',
    tags: ['System'],
    security: [{ apiKey: [] }],
    responses: {
      '200': {
        description: 'API key details',
        content: {
          'application/json': {
            example: { success: true, data: { key_id: 1, name: 'My Key', key_prefix: 'vbt_a1b2c3', permissions: ['read', 'write:quotes'], user_role: 'user', rate_limits: { read: { limit: 1000, window: 3600, used: 42, remaining: 958, reset: 1700000000 }, write: { limit: 1000, window: 3600, used: 3, remaining: 997, reset: 1700000000 } } } },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  if (!api) {
    throwServer(401, 'API key authentication required')
  }

  const now = Math.floor(Date.now() / 1000)
  const readBucket = Math.floor(now / api.readWindowSec)
  const writeBucket = Math.floor(now / api.writeWindowSec)

  const [readUsed, writeUsed] = await Promise.all([
    kv.get<number>(`ratelimit:apikey:read:${api.id}:${readBucket}`),
    kv.get<number>(`ratelimit:apikey:write:${api.id}:${writeBucket}`),
  ])

  return {
    success: true,
    data: {
      key_id: api.id,
      name: api.name,
      key_prefix: api.keyPrefix,
      permissions: api.permissions,
      user_role: api.userRole,
      rate_limits: {
        read: {
          limit: api.readRateLimit,
          window: api.readWindowSec,
          used: readUsed ?? 0,
          remaining: readUsed !== null ? Math.max(0, api.readRateLimit - readUsed) : api.readRateLimit,
          reset: (readBucket + 1) * api.readWindowSec,
        },
        write: {
          limit: api.writeRateLimit,
          window: api.writeWindowSec,
          used: writeUsed ?? 0,
          remaining: writeUsed !== null ? Math.max(0, api.writeRateLimit - writeUsed) : api.writeRateLimit,
          reset: (writeBucket + 1) * api.writeWindowSec,
        },
      },
    },
  }
})
