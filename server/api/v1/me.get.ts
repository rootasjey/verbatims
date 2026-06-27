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
      rate_limit: api.rateLimit,
      rate_window: api.windowSec,
      user_role: api.userRole,
    },
  }
})
