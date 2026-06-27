import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from '../../utils/__tests__/test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('author.service', () => {
  it('findAuthorById returns undefined for non-existent author', async () => {
    const { findAuthorById } = await import('../author.service')
    const result = await findAuthorById(999)
    expect(result).toBeUndefined()
  })
})
