import { kv } from 'hub:kv'

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
