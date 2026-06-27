import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedUser, seedApiKey } from './test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('hashApiKey', () => {
  it('returns consistent hash for same input', async () => {
    const { hashApiKey } = await import('../api-key')
    const hash1 = hashApiKey('vbt_testkey123')
    const hash2 = hashApiKey('vbt_testkey123')
    expect(hash1).toBe(hash2)
  })

  it('returns different hash for different inputs', async () => {
    const { hashApiKey } = await import('../api-key')
    const hash1 = hashApiKey('vbt_key_one')
    const hash2 = hashApiKey('vbt_key_two')
    expect(hash1).not.toBe(hash2)
  })

  it('returns a hex string', async () => {
    const { hashApiKey } = await import('../api-key')
    const hash = hashApiKey('vbt_anykey')
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })
})

describe('generateApiKey', () => {
  it('returns object with plainKey, keyHash, keyPrefix', async () => {
    const { generateApiKey } = await import('../api-key')
    const result = generateApiKey()
    expect(result).toHaveProperty('plainKey')
    expect(result).toHaveProperty('keyHash')
    expect(result).toHaveProperty('keyPrefix')
  })

  it('generates key starting with vbt_', async () => {
    const { generateApiKey } = await import('../api-key')
    const { plainKey } = generateApiKey()
    expect(plainKey).toMatch(/^vbt_[0-9a-f]{64}$/)
  })

  it('keyPrefix is first 10 characters of plainKey', async () => {
    const { generateApiKey } = await import('../api-key')
    const { plainKey, keyPrefix } = generateApiKey()
    expect(keyPrefix).toBe(plainKey.slice(0, 10))
  })

  it('hashApiKey(plainKey) matches keyHash', async () => {
    const { generateApiKey, hashApiKey } = await import('../api-key')
    const { plainKey, keyHash } = generateApiKey()
    expect(hashApiKey(plainKey)).toBe(keyHash)
  })
})

describe('validateApiKey', () => {
  it('returns null for non-vbt_ prefixed key', async () => {
    const { validateApiKey } = await import('../api-key')
    const result = await validateApiKey('invalid-key')
    expect(result).toBeNull()
  })

  it('returns null for non-existent key', async () => {
    const { validateApiKey } = await import('../api-key')
    const result = await validateApiKey('vbt_nonexistent00000000000000000000000')
    expect(result).toBeNull()
  })

  it('returns ApiKeyData for valid key', async () => {
    const { validateApiKey, hashApiKey } = await import('../api-key')

    const key = 'vbt_validkey00000000000000000000000000'
    const hash = hashApiKey(key)

    await seedUser(currentDb.db, { id: 42, email: 'dev@test.cc', name: 'Dev' })
    await seedApiKey(currentDb.db, {
      userId: 42,
      name: 'Test Key',
      keyHash: hash,
      keyPrefix: 'vbt_validk',
      permissions: '["read","write"]',
    })

    const result = await validateApiKey(key)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Test Key')
    expect(result!.permissions).toEqual(['read', 'write'])
    expect(result!.userId).toBe(42)
    expect(result!.userRole).toBe('user')
  })

  it('returns null for inactive key', async () => {
    const { validateApiKey, hashApiKey } = await import('../api-key')

    seedUser(currentDb.db, { id: 7, email: 'inactive@test.cc', name: 'Inactive' })
    seedApiKey(currentDb.db, {
      userId: 7,
      name: 'Inactive Key',
      keyHash: hashApiKey('vbt_inactivekey00000000000000000000000'),
      keyPrefix: 'vbt_inacti',
      isActive: false,
    })

    const result = await validateApiKey('vbt_inactivekey00000000000000000000000')
    expect(result).toBeNull()
  })

  it('returns null for expired key', async () => {
    const { validateApiKey, hashApiKey } = await import('../api-key')

    seedUser(currentDb.db, { id: 8, email: 'expired@test.cc', name: 'Expired' })
    seedApiKey(currentDb.db, {
      userId: 8,
      name: 'Expired Key',
      keyHash: hashApiKey('vbt_expiredkey000000000000000000000000'),
      keyPrefix: 'vbt_expire',
      expiresAt: new Date('2020-01-01'),
    })

    const result = await validateApiKey('vbt_expiredkey000000000000000000000000')
    expect(result).toBeNull()
  })
})

describe('requireApiPermission', () => {
  it('passes when permission is in the list', async () => {
    const { requireApiPermission } = await import('../api-key')
    const apiKey = {
      id: 1, userId: 1, name: '', keyPrefix: '',
      permissions: ['read', 'write', 'delete'],
      rateLimit: 1000, windowSec: 3600, isActive: true, userRole: 'user',
    }
    expect(() => requireApiPermission(apiKey, 'read')).not.toThrow()
  })

  it('passes when permissions include wildcard', async () => {
    const { requireApiPermission } = await import('../api-key')
    const apiKey = {
      id: 1, userId: 1, name: '', keyPrefix: '',
      permissions: ['*'],
      rateLimit: 1000, windowSec: 3600, isActive: true, userRole: 'user',
    }
    expect(() => requireApiPermission(apiKey, 'anything')).not.toThrow()
  })

  it('throws 403 when permission is missing', async () => {
    const { requireApiPermission } = await import('../api-key')
    const apiKey = {
      id: 1, userId: 1, name: '', keyPrefix: '',
      permissions: ['read'],
      rateLimit: 1000, windowSec: 3600, isActive: true, userRole: 'user',
    }
    expect(() => requireApiPermission(apiKey, 'admin')).toThrow()
  })
})
