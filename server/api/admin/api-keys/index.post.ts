import { db, schema } from 'hub:db'
import { generateApiKey } from '~~/server/utils/api-key'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)

  const body = await readBody<{ name: string; tier?: string; permissions?: string[]; readRateLimit?: number; readWindowSec?: number; writeRateLimit?: number; writeWindowSec?: number }>(event)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throwServer(400, 'Name is required')
  }

  const name = body.name.trim()
  const tier = body.tier === 'pro' || body.tier === 'enterprise' ? body.tier : 'free'
  const permissions = Array.isArray(body.permissions) ? body.permissions : ['read']
  const readRateLimit = typeof body.readRateLimit === 'number' ? body.readRateLimit : 1000
  const readWindowSec = typeof body.readWindowSec === 'number' ? body.readWindowSec : 3600
  const writeRateLimit = typeof body.writeRateLimit === 'number' ? body.writeRateLimit : 1000
  const writeWindowSec = typeof body.writeWindowSec === 'number' ? body.writeWindowSec : 3600

  const { plainKey, keyHash, keyPrefix } = generateApiKey()

  const result = await db.insert(schema.apiKeys).values({
    userId: user.id,
    name,
    keyHash,
    keyPrefix,
    tier,
    permissions: JSON.stringify(permissions),
    readRateLimit,
    readWindowSec,
    writeRateLimit,
    writeWindowSec,
  }).returning().get()

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      keyPrefix: result.keyPrefix,
      tier: result.tier,
      permissions,
      readRateLimit: result.readRateLimit,
      readWindowSec: result.readWindowSec,
      writeRateLimit: result.writeRateLimit,
      writeWindowSec: result.writeWindowSec,
      isActive: result.isActive,
      createdAt: result.createdAt,
      plainKey,
    },
  }
})
