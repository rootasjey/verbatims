import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedUser, seedQuote } from '../../utils/__tests__/test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('view-tracking.service', () => {
  it('trackView records a new view', async () => {
    const { trackView } = await import('../view-tracking.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@test.cc', name: 'U' })
    await seedQuote(currentDb.db, { id: 100, userId: 1 })

    const result = await trackView('quote', 100, 1, '127.0.0.1', 'test-agent')
    expect(result.recorded).toBe(true)
  })

  it('trackView returns recorded false for duplicate view within window', async () => {
    const { trackView } = await import('../view-tracking.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@test.cc', name: 'U' })
    await seedQuote(currentDb.db, { id: 100, userId: 1 })

    await trackView('quote', 100, 1, '127.0.0.1', 'test-agent')
    const result = await trackView('quote', 100, 1, '127.0.0.1', 'test-agent')
    expect(result.recorded).toBe(false)
  })

  it('trackView records separately for different users', async () => {
    const { trackView } = await import('../view-tracking.service')

    await seedUser(currentDb.db, { id: 10, email: 'a@test.cc', name: 'A' })
    await seedUser(currentDb.db, { id: 11, email: 'b@test.cc', name: 'B' })
    await seedQuote(currentDb.db, { id: 100, userId: 10 })

    const r1 = await trackView('quote', 100, 10, '1.1.1.1', 'agent')
    const r2 = await trackView('quote', 100, 11, '2.2.2.2', 'agent')
    expect(r1.recorded).toBe(true)
    expect(r2.recorded).toBe(true)
  })

  it('checkEntityExists returns true for existing entity', async () => {
    const { checkEntityExists } = await import('../view-tracking.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@test.cc', name: 'U' })
    await seedQuote(currentDb.db, { id: 100, userId: 1 })

    const result = await checkEntityExists('quote', 100)
    expect(result).toBe(true)
  })

  it('checkEntityExists returns false for non-existing entity', async () => {
    const { checkEntityExists } = await import('../view-tracking.service')
    const result = await checkEntityExists('quote', 999)
    expect(result).toBe(false)
  })
})
