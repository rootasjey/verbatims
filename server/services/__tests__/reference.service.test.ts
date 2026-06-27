import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedUser, seedQuote, seedReference } from '../../utils/__tests__/test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('reference.service', () => {
  it('findReferenceById returns undefined for non-existent', async () => {
    const { findReferenceById } = await import('../reference.service')
    const result = await findReferenceById(999)
    expect(result).toBeUndefined()
  })

  it('findReferenceById returns reference when found', async () => {
    const { findReferenceById } = await import('../reference.service')

    await seedReference(currentDb.db, { id: 50, name: 'Meditations', primaryType: 'book' })

    const result = await findReferenceById(50)
    expect(result).not.toBeUndefined()
    expect(result!.name).toBe('Meditations')
  })

  it('countReferenceQuotes returns 0 when no quotes', async () => {
    const { countReferenceQuotes } = await import('../reference.service')

    await seedReference(currentDb.db, { id: 70, name: 'Empty Ref', primaryType: 'book' })

    const count = await countReferenceQuotes(70)
    expect(count).toBe(0)
  })

  it('countReferenceQuotes counts approved quotes only', async () => {
    const { countReferenceQuotes } = await import('../reference.service')

    await seedUser(currentDb.db, { id: 5, email: 'u@t.c', name: 'U' })
    await seedReference(currentDb.db, { id: 80, name: 'Counted Ref', primaryType: 'book' })
    await seedQuote(currentDb.db, { id: 200, referenceId: 80, userId: 5, status: 'approved' })
    await seedQuote(currentDb.db, { id: 201, referenceId: 80, userId: 5, status: 'draft' })

    const count = await countReferenceQuotes(80)
    expect(count).toBe(1)
  })
})
