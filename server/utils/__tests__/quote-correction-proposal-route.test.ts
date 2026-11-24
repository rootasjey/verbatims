import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDb, seedQuote, seedUser } from './test-db'
import type { TestDb } from './test-db'

let testDb: TestDb
let createProposalRoute: (event: any) => Promise<any>
let applyProposalRoute: (event: any) => Promise<any>

vi.mock('hub:db', async () => ({
  get db() { return testDb.db },
  schema: await import('../../db/schema'),
}))

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (handler: (event: any) => unknown) => handler)
  vi.stubGlobal('readBody', async (event: any) => event.body)
  vi.stubGlobal('setResponseStatus', (event: any, status: number) => { event.statusCode = status })
  vi.stubGlobal('getRouterParam', (event: any, key: string) => event.params?.[key])
  vi.stubGlobal('getHeader', (event: any, name: string) => event.node?.req?.headers?.[name.toLowerCase()])
  vi.stubGlobal('throwServer', (statusCode: number, message: string) => { throw Object.assign(new Error(message), { statusCode }) })
  createProposalRoute = (await import('../../api/v1/quote-corrections/proposals/index.post')).default as any
  applyProposalRoute = (await import('../../api/v1/quote-corrections/proposals/[id]/apply.post')).default as any
})

afterAll(() => vi.unstubAllGlobals())

beforeEach(() => {
  testDb = createTestDb()
})

function apiEvent(body?: unknown) {
  return {
    body,
    context: {
      source: 'api_v1',
      api: {
        id: 11, userId: 2, userName: 'Reviewer', name: 'Test API key', keyPrefix: 'vbt_test',
        permissions: ['propose:quote-corrections', 'apply:quote-corrections'],
      },
    },
    params: {},
    node: { req: { headers: {} } },
  }
}

describe('quote correction proposal routes', () => {
  it('creates and applies a repaired timecode using the same normalized proof value', async () => {
    await seedUser(testDb.db, { id: 1 })
    await seedUser(testDb.db, { id: 2, email: 'reviewer@verbatims.cc' })
    await seedQuote(testDb.db, { id: 1, userId: 1, name: 'A quotation' })
    const [source] = await testDb.db.insert(testDb.schema.quoteSources).values({
      quoteId: 1, sourceType: 'primary', sourceUrl: 'https://example.com/edition-a', label: 'Edition A',
    }).returning()

    const proposalEvent = apiEvent({
      target_type: 'source', quote_id: 1, target_id: source!.id,
      payload: {
        changes: {
          locator_type: { before: null, after: 'timecode' },
          locator_value: { before: null, after: '01:23' },
        },
        evidence: [{ source_id: source!.id, locator_type: 'timecode', locator_value: '01:23' }],
      },
    })
    const created = await createProposalRoute(proposalEvent)
    expect(proposalEvent.statusCode).toBe(201)
    expect(created.data.payload.evidence[0].locator_value).toBe('00:01:23')
    expect(created.data.payload.changes.locator_value.after).toBe('00:01:23')

    const proposal = await testDb.db.select().from(testDb.schema.quoteCorrectionProposals).where(eq(
      testDb.schema.quoteCorrectionProposals.id, created.data.id,
    )).get()
    expect(proposal).toBeDefined()
    await testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId: created.data.id, fingerprint: proposal!.fingerprint, decision: 'approved', decidedBy: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    const applyEvent = apiEvent()
    applyEvent.params.id = String(created.data.id)
    const applied = await applyProposalRoute(applyEvent)
    expect(applied).toMatchObject({ success: true, result: 'applied', verified: true })
    const updatedSource = await testDb.db.select().from(testDb.schema.quoteSources).where(eq(testDb.schema.quoteSources.id, source!.id)).get()
    expect(updatedSource?.locatorType).toBe('timecode')
    expect(updatedSource?.locatorValue).toBe('00:01:23')
  })

  it('allows a source type with an empty stored value to be repaired', async () => {
    await seedUser(testDb.db, { id: 1 })
    await seedQuote(testDb.db, { id: 1, userId: 1, name: 'A quotation' })
    const [source] = await testDb.db.insert(testDb.schema.quoteSources).values({
      quoteId: 1, sourceType: '', sourceUrl: 'https://example.com/edition-a', label: 'Edition A',
      locatorType: 'page', locatorValue: '14',
    }).returning()
    const result = await createProposalRoute(apiEvent({
      target_type: 'source', quote_id: 1, target_id: source!.id,
      payload: {
        changes: { source_type: { before: '', after: 'primary' } },
        evidence: [{ source_id: source!.id, locator_type: 'page', locator_value: '14' }],
      },
    }))
    expect(result.data.payload.changes.source_type).toEqual({ before: '', after: 'primary' })
  })
})
