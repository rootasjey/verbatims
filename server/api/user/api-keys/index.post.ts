import { db, schema } from 'hub:db'
import { generateApiKey } from '~~/server/utils/api-key'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const body = await readBody<{ name: string }>(event)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throwServer(400, 'Name is required')
  }

  const name = body.name.trim()
  const { plainKey, keyHash, keyPrefix } = generateApiKey()

  const result = await db.insert(schema.apiKeys).values({
    userId: user.id,
    name,
    keyHash,
    keyPrefix,
    tier: 'free',
    permissions: JSON.stringify(['read']),
    rateLimit: 1000,
    windowSec: 3600,
  }).returning().get()

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      keyPrefix: result.keyPrefix,
      plainKey,
      createdAt: result.createdAt,
    },
  }
})
