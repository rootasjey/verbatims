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
})
