import { db, schema } from 'hub:db'
import { checkRateLimit, setRateLimitHeaders } from '../utils/rate-limit'

const publicV1Paths = [
  '/api/v1/docs',
  '/api/v1/health',
  '/api/v1/openapi.json',
]

export default defineEventHandler(async (event) => {
  const path = event.path || event.node.req.url || ''

  if (!path.startsWith('/api/v1/')) return
  if (publicV1Paths.some(p => path.startsWith(p))) return

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throwServer(401, 'Missing Authorization header. Use: Authorization: Bearer vbt_xxx')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throwServer(401, 'Invalid Authorization format. Use: Authorization: Bearer vbt_xxx')
  }

  const apiKey = authHeader.slice(7).trim()
  if (!apiKey) {
    throwServer(401, 'Missing API key')
  }

  const keyData = await validateApiKey(apiKey)
  if (!keyData) {
    throwServer(401, 'Invalid or inactive API key')
  }

  const method = event.method || 'GET'
  const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH'

  if (isWrite) {
    const bucket = Math.floor(Date.now() / 1000 / keyData.writeWindowSec)
    const key = `ratelimit:apikey:write:${keyData.id}:${bucket}`
    const result = await checkRateLimit({ key, max: keyData.writeRateLimit, window: keyData.writeWindowSec })
    setRateLimitHeaders(event, result)
    if (!result.success) throwServer(429, 'Write rate limit exceeded. Try again later.')
  } else {
    const bucket = Math.floor(Date.now() / 1000 / keyData.readWindowSec)
    const key = `ratelimit:apikey:read:${keyData.id}:${bucket}`
    const result = await checkRateLimit({ key, max: keyData.readRateLimit, window: keyData.readWindowSec })
    setRateLimitHeaders(event, result)
    if (!result.success) throwServer(429, 'Read rate limit exceeded. Try again later.')
  }

  db.insert(schema.apiKeyUsageLogs).values({
    apiKeyId: keyData.id,
    endpoint: path,
    method: event.method || 'GET',
    statusCode: 200,
    ipAddress: getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || null,
  }).run().catch(() => {})

  event.context.api = keyData
})
