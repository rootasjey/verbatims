import { db, schema } from 'hub:db'
import { checkRateLimit, setRateLimitHeaders } from '../utils/rate-limit'

const publicV1Paths = [
  '/api/v1/docs',
  '/api/v1/health',
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

  const windowBucket = Math.floor(Date.now() / 1000 / keyData.windowSec)
  const rateLimitKey = `ratelimit:apikey:${keyData.id}:${windowBucket}`
  const rateResult = await checkRateLimit({ key: rateLimitKey, max: keyData.rateLimit, window: keyData.windowSec })
  setRateLimitHeaders(event, rateResult)

  if (!rateResult.success) {
    throwServer(429, 'Rate limit exceeded. Try again later.')
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
