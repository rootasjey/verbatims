import { vi, describe, it, expect, beforeEach } from 'vitest'

let kvStore: Record<string, number> = {}

vi.mock('hub:kv', () => ({
  kv: {
    get: vi.fn(async (key: string) => kvStore[key] ?? null),
    set: vi.fn(async (key: string, value: number, _opts?: any) => { kvStore[key] = value }),
  },
}))

beforeEach(() => {
  kvStore = {}
})

describe('checkRateLimit', () => {
  it('allows first request', async () => {
    const { checkRateLimit } = await import('../rate-limit')
    const result = await checkRateLimit({ key: 'test:1', max: 5, window: 60 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('decrements remaining on each call', async () => {
    const { checkRateLimit } = await import('../rate-limit')

    const r1 = await checkRateLimit({ key: 'test:2', max: 3, window: 60 })
    expect(r1.remaining).toBe(2)

    const r2 = await checkRateLimit({ key: 'test:2', max: 3, window: 60 })
    expect(r2.remaining).toBe(1)

    const r3 = await checkRateLimit({ key: 'test:2', max: 3, window: 60 })
    expect(r3.remaining).toBe(0)
  })

  it('blocks when limit is exceeded', async () => {
    const { checkRateLimit } = await import('../rate-limit')

    for (let i = 0; i < 2; i++) {
      await checkRateLimit({ key: 'test:3', max: 2, window: 60 })
    }

    const result = await checkRateLimit({ key: 'test:3', max: 2, window: 60 })
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('uses different windows independently', async () => {
    const { checkRateLimit } = await import('../rate-limit')

    const r1 = await checkRateLimit({ key: 'test:4', max: 1, window: 60 })
    expect(r1.success).toBe(true)

    const r2 = await checkRateLimit({ key: 'test:5', max: 1, window: 60 })
    expect(r2.success).toBe(true)
  })
})


