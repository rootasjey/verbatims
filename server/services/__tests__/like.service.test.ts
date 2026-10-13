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

describe('like.service', () => {
  it('findExistingLike returns undefined when no like exists', async () => {
    const { findExistingLike } = await import('../like.service')
    const result = await findExistingLike('quote', 999, 1)
    expect(result).toBeUndefined()
  })

  it('toggleLike creates a like on first call and removes on second', async () => {
    const { toggleLike, findExistingLike } = await import('../like.service')

    await seedUser(currentDb.db, { id: 10, email: 'u1@test.cc', name: 'U1' })
    await seedQuote(currentDb.db, { id: 100, userId: 10 })

    const first = await toggleLike('quote', 100, 10)
    expect(first.isLiked).toBe(true)

    const second = await toggleLike('quote', 100, 10)
    expect(second.isLiked).toBe(false)

    const like = await findExistingLike('quote', 100, 10)
    expect(like).toBeUndefined()
  })

  it('toggleLike works independently for different users', async () => {
    const { toggleLike, findExistingLike } = await import('../like.service')

    await seedUser(currentDb.db, { id: 20, email: 'u2@test.cc', name: 'U2' })
    await seedUser(currentDb.db, { id: 21, email: 'u3@test.cc', name: 'U3' })
    await seedQuote(currentDb.db, { id: 200, userId: 20 })

    await toggleLike('quote', 200, 20)
    await toggleLike('quote', 200, 21)

    const like1 = await findExistingLike('quote', 200, 20)
    const like2 = await findExistingLike('quote', 200, 21)
    expect(like1).toBeDefined()
    expect(like2).toBeDefined()
  })

  it('getLikesCount returns 0 for unliked entity', async () => {
    const { getLikesCount } = await import('../like.service')
    const count = await getLikesCount('quote', 999)
    expect(count).toBe(0)
  })

  it('addQuoteLikes adds only missing likes and is idempotent', async () => {
    const { addQuoteLikes, findExistingLike } = await import('../like.service')
    await seedUser(currentDb.db, { id: 30, email: 'bulk@test.cc', name: 'Bulk' })
    await seedQuote(currentDb.db, { id: 300, userId: 30 })
    await seedQuote(currentDb.db, { id: 301, userId: 30 })
    await seedQuote(currentDb.db, { id: 302, userId: 30 })

    await addQuoteLikes([300], 30)
    const added = await addQuoteLikes([300, 301, 302], 30)
    const repeated = await addQuoteLikes([300, 301, 302], 30)

    expect(added).toEqual([301, 302])
    expect(repeated).toEqual([])
    await expect(findExistingLike('quote', 301, 30)).resolves.toBeDefined()
  })

  it('removeQuoteLikes removes only the selected user quote likes', async () => {
    const { addQuoteLikes, findExistingLike, removeQuoteLikes } = await import('../like.service')
    await seedUser(currentDb.db, { id: 40, email: 'remove-bulk@test.cc', name: 'Remove bulk' })
    await seedUser(currentDb.db, { id: 41, email: 'keep-bulk@test.cc', name: 'Keep bulk' })
    await seedQuote(currentDb.db, { id: 400, userId: 40 })
    await seedQuote(currentDb.db, { id: 401, userId: 40 })
    await addQuoteLikes([400, 401], 40)
    await addQuoteLikes([400], 41)

    await removeQuoteLikes([400, 401], 40)

    await expect(findExistingLike('quote', 400, 40)).resolves.toBeUndefined()
    await expect(findExistingLike('quote', 401, 40)).resolves.toBeUndefined()
    await expect(findExistingLike('quote', 400, 41)).resolves.toBeDefined()
  })
})
