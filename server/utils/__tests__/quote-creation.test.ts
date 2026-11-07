import { beforeEach, describe, expect, it, vi } from 'vitest'
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
