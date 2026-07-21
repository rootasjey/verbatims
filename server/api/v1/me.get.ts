export default defineEventHandler(async (event) => {
  const api = event.context.api
  if (!api) {
    throwServer(401, 'API key authentication required')
  }

  return {
    success: true,
    data: {
      key_id: api.id,
      name: api.name,
      key_prefix: api.keyPrefix,
      permissions: api.permissions,
      read_rate_limit: api.readRateLimit,
      read_window: api.readWindowSec,
      write_rate_limit: api.writeRateLimit,
      write_window: api.writeWindowSec,
      user_role: api.userRole,
    },
  }
})
