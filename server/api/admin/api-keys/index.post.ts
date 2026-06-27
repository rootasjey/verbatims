import { db, schema } from 'hub:db'
import { generateApiKey } from '~~/server/utils/api-key'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)

  const body = await readBody<{ name: string; tier?: string; permissions?: string[]; rateLimit?: number; windowSec?: number }>(event)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throwServer(400, 'Name is required')
  }

  const name = body.name.trim()
  const tier = body.tier === 'pro' || body.tier === 'enterprise' ? body.tier : 'free'
  const permissions = Array.isArray(body.permissions) ? body.permissions : ['read']
  const rateLimit = typeof body.rateLimit === 'number' ? body.rateLimit : 1000
  const windowSec = typeof body.windowSec === 'number' ? body.windowSec : 3600

  const { plainKey, keyHash, keyPrefix } = generateApiKey()

  const result = await db.insert(schema.apiKeys).values({
    userId: user.id,
    name,
    keyHash,
    keyPrefix,
    tier,
    permissions: JSON.stringify(permissions),
    rateLimit,
    windowSec,
  }).returning().get()

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      keyPrefix: result.keyPrefix,
      tier: result.tier,
      permissions,
      rateLimit: result.rateLimit,
      windowSec: result.windowSec,
      isActive: result.isActive,
      createdAt: result.createdAt,
      plainKey,
    },
  }
})
