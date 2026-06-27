import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { sha256 } from '@noble/hashes/sha2.js'

const API_KEY_PREFIX = 'vbt_'

export function generateApiKey(): { plainKey: string; keyHash: string; keyPrefix: string } {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('')
  const plainKey = `${API_KEY_PREFIX}${hex}`
  const keyHash = hashApiKey(plainKey)
  const keyPrefix = plainKey.slice(0, 10)
  return { plainKey, keyHash, keyPrefix }
}

export function hashApiKey(key: string): string {
  const hash = sha256(new TextEncoder().encode(key))
  return Array.from(hash).map((b: number) => b.toString(16).padStart(2, '0')).join('')
}

export interface ApiKeyData {
  id: number
  userId: number
  name: string
  keyPrefix: string
  permissions: string[]
  rateLimit: number
  windowSec: number
  isActive: boolean
  userRole: string
}

export async function validateApiKey(key: string): Promise<ApiKeyData | null> {
  if (!key.startsWith(API_KEY_PREFIX)) return null

  const keyHash = hashApiKey(key)

  const result = await db
    .select({
      id: schema.apiKeys.id,
      userId: schema.apiKeys.userId,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      permissions: schema.apiKeys.permissions,
      rateLimit: schema.apiKeys.rateLimit,
      windowSec: schema.apiKeys.windowSec,
      isActive: schema.apiKeys.isActive,
      expiresAt: schema.apiKeys.expiresAt,
      userRole: schema.users.role,
    })
    .from(schema.apiKeys)
    .innerJoin(schema.users, eq(schema.apiKeys.userId, schema.users.id))
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .get()

  if (!result) return null
  if (!result.isActive) return null
  if (result.expiresAt && new Date(result.expiresAt).getTime() < Date.now()) return null

  db.update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, result.id))
    .run()
    .catch(() => {})

  return {
    id: result.id,
    userId: result.userId,
    name: result.name,
    keyPrefix: result.keyPrefix,
    permissions: JSON.parse(result.permissions!) as string[],
    rateLimit: result.rateLimit,
    windowSec: result.windowSec,
    isActive: result.isActive,
    userRole: result.userRole!,
  }
}

export function requireApiPermission(apiKey: ApiKeyData, permission: string): void {
  if (!apiKey.permissions.includes('*') && !apiKey.permissions.includes(permission)) {
    throwServer(403, `API key missing required permission: ${permission}`)
  }
}
