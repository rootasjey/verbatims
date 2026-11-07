import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDb, seedQuote, seedUser } from './test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('quote import batches', () => {
  it('creates and then reuses inline authors and references across batches', async () => {
    const { buildQuoteCreationStatements } = await import('../quote-creation')
    await seedUser(currentDb.db)

    for (const [index, authorName] of ['Ada Lovelace', 'ada lovelace'].entries()) {
      const { statements } = buildQuoteCreationStatements({
        requestKey: `import:${index + 1}`,
        userId: 1,
        payloadHash: `hash-${index + 1}`,
        quote: { name: `Quote ${index + 1}`, language: 'en' },
        authorId: null,
        referenceId: null,
        newAuthor: { name: authorName, job: 'Mathematician' },
        newReference: { name: 'Analytical Engine', primaryType: 'book' },
        primaryAttribution: { status: 'unverified' },
        retainIdempotencyRecord: false,
      })

      await currentDb.db.batch(statements as never[])
    }

    const authors = await currentDb.db.select().from(currentDb.schema.authors).all()
    const references = await currentDb.db.select().from(currentDb.schema.quoteReferences).all()
    const attributions = await currentDb.db.select().from(currentDb.schema.quoteAttributions).all()
    expect(authors).toHaveLength(1)
    expect(references).toHaveLength(1)
    expect(attributions).toHaveLength(2)
    expect(attributions.every(attribution => attribution.authorId === authors[0]?.id)).toBe(true)
    expect(attributions.every(attribution => attribution.referenceId === references[0]?.id)).toBe(true)
  })

  it('deduplicates an upsert attribution and source in its batch', async () => {
    const { buildQuoteImportUpsertStatements } = await import('../quote-creation')
    await seedUser(currentDb.db)
    await currentDb.db.insert(currentDb.schema.authors).values({ name: 'Ada Lovelace' })
    await seedQuote(currentDb.db)

    const makeStatements = (requestKey: string) => buildQuoteImportUpsertStatements({
      requestKey,
      userId: 1,
      payloadHash: `hash-${requestKey}`,
      quoteId: 1,
      updateData: {},
      authorId: 1,
      referenceId: null,
      attributionIsPrimary: true,
      source: { source_type: 'manual', source_url: 'https://example.com/quote' },
      retainIdempotencyRecord: false,
    })

    await currentDb.db.batch(makeStatements('upsert:1') as never[])
    await currentDb.db.batch(makeStatements('upsert:2') as never[])

    const attributions = await currentDb.db.select().from(currentDb.schema.quoteAttributions).all()
    const sources = await currentDb.db.select().from(currentDb.schema.quoteSources).all()
    expect(attributions).toHaveLength(1)
    expect(sources).toHaveLength(1)
    expect(sources[0]?.attributionId).toBe(attributions[0]?.id)
  })
})

describe('quote edit batches', () => {
  it('resolves inline entities in the same batch as the quote and attribution edit', async () => {
    const { buildQuoteInlineEditResolutionStatements } = await import('../quote-creation')
    await seedUser(currentDb.db)
    await seedQuote(currentDb.db)
    await currentDb.db.insert(currentDb.schema.quoteAttributions).values({
      quoteId: 1,
      authorId: null,
      referenceId: null,
      isPrimary: true,
      status: 'unverified',
    })

    const resolution = buildQuoteInlineEditResolutionStatements({
      requestKey: 'quote-edit:1',
      userId: 1,
      quoteId: 1,
      authorId: null,
      referenceId: null,
      newAuthor: { name: 'Ada Lovelace' },
      newReference: { name: 'Analytical Engine', primaryType: 'book' },
    })
    await currentDb.db.batch([
      ...resolution.statements as never[],
      currentDb.db.update(currentDb.schema.quotes).set({ name: 'Edited quote' }).where(eq(currentDb.schema.quotes.id, 1)),
      currentDb.db.update(currentDb.schema.quoteAttributions)
        .set({ authorId: resolution.authorId, referenceId: resolution.referenceId })
        .where(eq(currentDb.schema.quoteAttributions.quoteId, 1)),
      resolution.setPrimaryAttributionId(1),
      resolution.cleanup,
    ] as never[])

    const authors = await currentDb.db.select().from(currentDb.schema.authors).all()
    const references = await currentDb.db.select().from(currentDb.schema.quoteReferences).all()
    const quote = await currentDb.db.select().from(currentDb.schema.quotes).where(eq(currentDb.schema.quotes.id, 1)).get()
    const attribution = await currentDb.db.select().from(currentDb.schema.quoteAttributions).where(eq(currentDb.schema.quoteAttributions.quoteId, 1)).get()
    const requests = await currentDb.db.select().from(currentDb.schema.quoteCreationRequests).all()
    expect(authors).toHaveLength(1)
    expect(references).toHaveLength(1)
    expect(quote?.name).toBe('Edited quote')
    expect(attribution?.authorId).toBe(authors[0]?.id)
    expect(attribution?.referenceId).toBe(references[0]?.id)
    expect(requests).toHaveLength(0)
  })

  it('blocks an active quote rename that collides with normalized text', async () => {
    const { isQuoteNameConflictError } = await import('../quote-creation')
    await seedUser(currentDb.db)
    await seedQuote(currentDb.db, { name: 'First quote', status: 'approved' })
    await seedQuote(currentDb.db, { name: 'Second quote', status: 'draft' })

    let caught: unknown
    try {
      await currentDb.db.update(currentDb.schema.quotes)
        .set({ name: '  FIRST QUOTE  ' })
        .where(eq(currentDb.schema.quotes.id, 2))
        .run()
    } catch (error) {
      caught = error
    }
    expect(isQuoteNameConflictError(caught)).toBe(true)
  })

  it('rolls back inline entities when the quote edit fails', async () => {
    const { buildQuoteInlineEditResolutionStatements } = await import('../quote-creation')
    await seedUser(currentDb.db)
    await seedQuote(currentDb.db, { id: 1, name: 'Existing quote', status: 'approved' })
    await seedQuote(currentDb.db, { id: 2, name: 'Quote to rename', status: 'draft' })

    const resolution = buildQuoteInlineEditResolutionStatements({
      requestKey: 'quote-edit:rollback',
      userId: 1,
      quoteId: 2,
      authorId: null,
      referenceId: null,
      newAuthor: { name: 'Ada Lovelace' },
      newReference: { name: 'Analytical Engine', primaryType: 'book' },
    })

    await expect(currentDb.db.batch([
      ...resolution.statements as never[],
      currentDb.db.update(currentDb.schema.quotes)
        .set({ name: ' existing quote ' })
        .where(eq(currentDb.schema.quotes.id, 2)),
      resolution.cleanup,
    ] as never[])).rejects.toThrow()

    expect(await currentDb.db.select().from(currentDb.schema.authors).all()).toHaveLength(0)
    expect(await currentDb.db.select().from(currentDb.schema.quoteReferences).all()).toHaveLength(0)
    expect(await currentDb.db.select().from(currentDb.schema.quoteCreationRequests).all()).toHaveLength(0)
    const quote = await currentDb.db.select().from(currentDb.schema.quotes)
      .where(eq(currentDb.schema.quotes.id, 2)).get()
    expect(quote?.name).toBe('Quote to rename')
  })

  it('allows rejected duplicates but blocks their activation while the text is claimed', async () => {
    await seedUser(currentDb.db)
    await seedQuote(currentDb.db, { name: 'Existing quote', status: 'approved' })
    await seedQuote(currentDb.db, { name: 'Rejected duplicate', status: 'rejected' })

    await expect(currentDb.db.update(currentDb.schema.quotes)
      .set({ name: ' existing quote ' })
      .where(eq(currentDb.schema.quotes.id, 2))
      .run()).resolves.toBeDefined()

    await expect(currentDb.db.update(currentDb.schema.quotes)
      .set({ status: 'approved' })
      .where(eq(currentDb.schema.quotes.id, 2))
      .run()).rejects.toThrow()

    const rejectedQuote = await currentDb.db.select().from(currentDb.schema.quotes)
      .where(eq(currentDb.schema.quotes.id, 2)).get()
    expect(rejectedQuote?.status).toBe('rejected')
  })
})
