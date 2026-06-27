import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedUser, seedQuote, seedTag, seedAuthor, seedReference } from '../../utils/__tests__/test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('quote.service', () => {
  it('findQuoteById returns null for non-existent', async () => {
    const { findQuoteById } = await import('../quote.service')
    const result = await findQuoteById(999)
    expect(result).toBeNull()
  })

  it('findQuoteById returns quote when found', async () => {
    const { findQuoteById } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'User' })
    await seedQuote(currentDb.db, { id: 100, userId: 1, name: 'To be or not to be' })

    const result = await findQuoteById(100)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('To be or not to be')
  })

  it('findQuoteById filters by status', async () => {
    const { findQuoteById } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'User' })
    await seedQuote(currentDb.db, { id: 200, userId: 1, status: 'draft', name: 'Draft quote' })

    const withoutStatus = await findQuoteById(200)
    expect(withoutStatus).not.toBeNull()

    const withStatus = await findQuoteById(200, 'approved')
    expect(withStatus).toBeNull()
  })

  it('createQuote creates and returns quote with id', async () => {
    const { createQuote } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 2, email: 'c@t.c', name: 'Creator' })

    const quote = await createQuote({
      name: 'New quote',
      language: 'en',
      userId: 2,
    })

    expect(quote.id).toBeGreaterThan(0)
  })

  it('countQuotes returns correct count', async () => {
    const { countQuotes } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'U' })
    await seedQuote(currentDb.db, { id: 300, userId: 1, status: 'approved', name: 'Q1' })
    await seedQuote(currentDb.db, { id: 301, userId: 1, status: 'approved', name: 'Q2' })
    await seedQuote(currentDb.db, { id: 302, userId: 1, status: 'draft', name: 'Q3' })

    const approved = await countQuotes({ status: 'approved' })
    expect(approved).toBe(2)

    const all = await countQuotes({} as any)
    expect(all).toBe(2)
  })

  it('updateQuote changes name', async () => {
    const { updateQuote, findQuoteById } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'U' })
    await seedQuote(currentDb.db, { id: 400, userId: 1, name: 'Old name' })

    await updateQuote(400, { name: 'New name' })

    const updated = await findQuoteById(400)
    expect(updated!.name).toBe('New name')
  })

  it('updateQuoteStatus changes status', async () => {
    const { updateQuoteStatus, findQuoteById } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'U' })
    await seedQuote(currentDb.db, { id: 500, userId: 1, status: 'pending', name: 'Pending' })

    await updateQuoteStatus(500, 'approved', 1)

    const updated = await findQuoteById(500)
    expect(updated!.status).toBe('approved')
  })

  it('deleteQuote removes quote from database', async () => {
    const { deleteQuote, findQuoteById } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'U' })
    await seedQuote(currentDb.db, { id: 600, userId: 1, name: 'Temporary' })

    await deleteQuote(600)

    const result = await findQuoteById(600)
    expect(result).toBeNull()
  })

  it('findTagsForQuote returns tags for a quote', async () => {
    const { findTagsForQuote } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'U' })
    await seedTag(currentDb.db, { id: 10, name: 'wisdom', color: '#3B82F6' })
    await seedQuote(currentDb.db, { id: 1000, userId: 1, status: 'approved', name: 'Wise quote' })

    await currentDb.db.insert(currentDb.schema.quoteTags).values({ quoteId: 1000, tagId: 10 })

    const tags = await findTagsForQuote(1000)
    expect(tags).toHaveLength(1)
    expect(tags[0]!.name).toBe('wisdom')
  })

  it('findQuoteRaw returns raw quote data', async () => {
    const { findQuoteRaw } = await import('../quote.service')

    await seedUser(currentDb.db, { id: 1, email: 'u@t.c', name: 'U' })
    await seedQuote(currentDb.db, { id: 1100, userId: 1, name: 'Raw quote' })

    const result = await findQuoteRaw(1100)
    expect(result).not.toBeUndefined()
    expect(result!.name).toBe('Raw quote')
  })
})
