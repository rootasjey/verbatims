import { db, schema } from 'hub:db'
import { generateApiKey } from '~~/server/utils/api-key'

const validPermissions = ['read', 'write:quotes', 'write:authors', 'write:references', 'write:collections', '*']

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const body = await readBody<{ name: string; permissions?: string[] }>(event)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throwServer(400, 'Name is required')
  }

  const name = body.name.trim()
  let permissions = body.permissions
  if (!Array.isArray(permissions) || permissions.length === 0) {
    permissions = ['read']
  }
  const invalid = permissions.filter(p => !validPermissions.includes(p))
  if (invalid.length > 0) {
    throwServer(400, `Invalid permissions: ${invalid.join(', ')}`)
  }

  const { plainKey, keyHash, keyPrefix } = generateApiKey()

  const result = await db.insert(schema.apiKeys).values({
    userId: user.id,
    name,
    keyHash,
    keyPrefix,
    tier: 'free',
    permissions: JSON.stringify(permissions),
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
