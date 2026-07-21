export type ApiKeyTier = 'free' | 'pro' | 'enterprise'

export interface ApiKey {
  id: number
  userId: number
  name: string
  keyPrefix: string
  tier: ApiKeyTier
  permissions: string[]
  readRateLimit: number
  readWindowSec: number
  writeRateLimit: number
  writeWindowSec: number
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
  readRateLimit?: number
  readWindowSec?: number
  writeRateLimit?: number
  writeWindowSec?: number
}

export interface UpdateApiKeyData {
  name?: string
  permissions?: string[]
  readRateLimit?: number
  readWindowSec?: number
  writeRateLimit?: number
  writeWindowSec?: number
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
