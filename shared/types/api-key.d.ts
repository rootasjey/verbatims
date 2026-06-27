export type ApiKeyTier = 'free' | 'pro' | 'enterprise'

export interface ApiKey {
  id: number
  userId: number
  name: string
  keyPrefix: string
  tier: ApiKeyTier
  permissions: string[]
  rateLimit: number
  windowSec: number
  isActive: boolean
  lastUsedAt: number | null
  expiresAt: number | null
  createdAt: number
  updatedAt: number
}

export interface ApiKeyWithPlainKey {
  apiKey: ApiKey
  plainKey: string
}

export interface CreateApiKeyData {
  name: string
  tier?: ApiKeyTier
  permissions?: string[]
  rateLimit?: number
  windowSec?: number
}

export interface UpdateApiKeyData {
  name?: string
  permissions?: string[]
  rateLimit?: number
  windowSec?: number
  isActive?: boolean
}

export interface ApiKeyAdminResponse {
  apiKeys: ApiKey[]
  total: number
}

export interface ApiKeyUsage {
  id: number
  apiKeyId: number
  endpoint: string
  method: string
  statusCode: number
  ipAddress: string | null
  createdAt: number
}
