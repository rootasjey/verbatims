import { beforeEach, describe, expect, it, vi } from 'vitest'
import { and, eq, isNull } from 'drizzle-orm'
import { createTestDb, seedQuote, seedUser } from './test-db'
import type { TestDb } from './test-db'
import { evidenceLocatorMatchesSnapshotOrRepair, sourceSnapshotMatchesCondition, snapshotQuoteSource } from '../quote-correction'
import { runApiAuditedBatch } from '../api-editorial-audit'

let testDb: TestDb

vi.mock('hub:db', async () => ({
  get db() { return testDb.db },
  schema: await import('../../db/schema'),
}))

beforeEach(() => {
  vi.stubGlobal('throwServer', (_statusCode: number, message: string) => { throw new Error(message) })
  testDb = createTestDb()
})

async function createProposal(proposedBy = 1, previousProposalId: number | null = null, version = 1) {
  const [proposal] = await testDb.db.insert(testDb.schema.quoteCorrectionProposals).values({
    quoteId: 1,
    targetType: 'quote',
    targetId: 1,
    version,
    previousProposalId,
    payload: JSON.stringify({ changes: { name: { before: 'Before', after: 'After' } }, evidence: [] }),
    fingerprint: 'fingerprint-v1',
    proposedBy,
  }).returning({ id: testDb.schema.quoteCorrectionProposals.id })
  return proposal!.id
}

describe('quote correction workflow database guards', () => {
  it('makes rejection terminal even if another approval is attempted afterward', async () => {
    await seedUser(testDb.db, { id: 1 })
    const proposalId = await createProposal()
    await testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId, fingerprint: 'fingerprint-v1', decision: 'rejected', decidedBy: 2, reason: 'Evidence does not support the wording',
    })

    await expect(testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId, fingerprint: 'fingerprint-v1', decision: 'approved', decidedBy: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })).rejects.toThrow()

    const activeProposalId = await createProposal(1, proposalId, 2)
    await testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId: activeProposalId, fingerprint: 'fingerprint-v1', decision: 'approved', decidedBy: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await expect(testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId: activeProposalId, fingerprint: 'fingerprint-v1', decision: 'rejected', decidedBy: 2, reason: 'Concurrent rejection',
    })).rejects.toThrow()
  })

  it('commits the quote mutation, applied marker, and success attempt together', async () => {
    await seedUser(testDb.db, { id: 1 })
    await seedQuote(testDb.db, { id: 1, userId: 1, name: 'Before' })
    const proposalId = await createProposal()
    await testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId, fingerprint: 'fingerprint-v1', decision: 'approved', decidedBy: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    const appliedAt = new Date()
    const applicationId = 'application-id-1'
    await runApiAuditedBatch({ context: { source: 'api_v1' }, node: { req: { headers: {} } } } as any, {
      id: 12, userId: 2, userName: 'Reviewer', name: 'Test API key', keyPrefix: 'vbt_test', permissions: [],
    } as any, [
      testDb.db.update(testDb.schema.quotes).set({ name: 'After', updatedAt: appliedAt }).where(eq(testDb.schema.quotes.id, 1)),
      testDb.db.update(testDb.schema.quoteCorrectionProposals).set({ appliedAt, applicationId }).where(and(
        eq(testDb.schema.quoteCorrectionProposals.id, proposalId),
        isNull(testDb.schema.quoteCorrectionProposals.appliedAt),
      )),
      testDb.db.insert(testDb.schema.quoteCorrectionApplyAttempts).values({
        proposalId, fingerprint: 'fingerprint-v1', applicationId, outcome: 'applied_unverified', actorUserId: 2,
      }),
    ], applicationId)

    await testDb.db.insert(testDb.schema.quoteCorrectionApplyAttempts).values({
      proposalId, fingerprint: 'fingerprint-v1', applicationId, outcome: 'verified', actorUserId: 2,
    })

    const quote = await testDb.db.select().from(testDb.schema.quotes).where(eq(testDb.schema.quotes.id, 1)).get()
    const proposal = await testDb.db.select().from(testDb.schema.quoteCorrectionProposals).where(eq(testDb.schema.quoteCorrectionProposals.id, proposalId)).get()
    const attempts = await testDb.db.select().from(testDb.schema.quoteCorrectionApplyAttempts).where(eq(testDb.schema.quoteCorrectionApplyAttempts.proposalId, proposalId)).all()
    expect(quote?.name).toBe('After')
    expect(proposal?.appliedAt).toBeInstanceOf(Date)
    expect(attempts.map(attempt => attempt.outcome)).toEqual(['applied_unverified', 'verified'])
    await expect(testDb.db.insert(testDb.schema.quoteCorrectionApplyAttempts).values({
      proposalId, fingerprint: 'fingerprint-v1', applicationId: 'different-application', outcome: 'verified', actorUserId: 2,
    })).rejects.toThrow()
  })

  it('rolls back the mutation if the applied marker cannot verify the resulting row', async () => {
    await seedUser(testDb.db, { id: 1 })
    await seedQuote(testDb.db, { id: 1, userId: 1, name: 'Before' })
    const proposalId = await createProposal()
    await testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId, fingerprint: 'fingerprint-v1', decision: 'approved', decidedBy: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    const appliedAt = new Date()
    const applicationId = 'failed-application-id'
    await expect(testDb.db.batch([
      testDb.db.update(testDb.schema.quotes).set({ name: 'After', updatedAt: appliedAt })
        .where(and(eq(testDb.schema.quotes.id, 1), eq(testDb.schema.quotes.name, 'Concurrent edit'))),
      testDb.db.insert(testDb.schema.quoteEditorialAuditEvents).values({
        action: 'update', targetType: 'quote', targetId: '1', requestId: applicationId, source: 'api_v1',
      }),
      testDb.db.update(testDb.schema.quoteCorrectionProposals).set({ appliedAt, applicationId })
        .where(eq(testDb.schema.quoteCorrectionProposals.id, proposalId)),
    ] as any)).rejects.toThrow()

    const quote = await testDb.db.select().from(testDb.schema.quotes).where(eq(testDb.schema.quotes.id, 1)).get()
    const proposal = await testDb.db.select().from(testDb.schema.quoteCorrectionProposals).where(eq(testDb.schema.quoteCorrectionProposals.id, proposalId)).get()
    expect(quote?.name).toBe('Before')
    expect(proposal?.appliedAt).toBeNull()
  })

  it('detects a source evidence change after its snapshot was recorded', async () => {
    await seedUser(testDb.db, { id: 1 })
    await seedQuote(testDb.db, { id: 1, userId: 1 })
    const [source] = await testDb.db.insert(testDb.schema.quoteSources).values({
      quoteId: 1, sourceType: 'primary', sourceUrl: 'https://example.com/edition-a',
      label: 'Edition A', locatorType: 'page', locatorValue: '14',
    }).returning()
    const snapshot = snapshotQuoteSource(source!)
    const matchesBeforeEdit = await testDb.db.select({ id: testDb.schema.quoteSources.id })
      .from(testDb.schema.quoteSources).where(sourceSnapshotMatchesCondition(source!.id, snapshot)).get()
    expect(matchesBeforeEdit?.id).toBe(source!.id)

    await testDb.db.update(testDb.schema.quoteSources).set({ sourceUrl: 'https://example.com/edition-b' })
      .where(eq(testDb.schema.quoteSources.id, source!.id))
    const matchesAfterEdit = await testDb.db.select({ id: testDb.schema.quoteSources.id })
      .from(testDb.schema.quoteSources).where(sourceSnapshotMatchesCondition(source!.id, snapshot)).get()
    expect(matchesAfterEdit).toBeUndefined()
  })

  it('allows a source proposal to carry its corrected exact locator as evidence', async () => {
    await seedUser(testDb.db, { id: 1 })
    await seedQuote(testDb.db, { id: 1, userId: 1 })
    const [source] = await testDb.db.insert(testDb.schema.quoteSources).values({
      quoteId: 1, sourceType: 'primary', sourceUrl: 'https://example.com/edition-a', label: 'Edition A',
    }).returning()
    const snapshot = snapshotQuoteSource(source!)
    const item = { source_id: source!.id, locator_type: 'page', locator_value: '14' }
    const payload = {
      changes: { locator_type: { before: null, after: 'page' }, locator_value: { before: null, after: '14' } },
      evidence: [item],
    }
    expect(evidenceLocatorMatchesSnapshotOrRepair('source', source!.id, item, snapshot, payload)).toBe(true)
    expect(evidenceLocatorMatchesSnapshotOrRepair('quote', source!.id, item, snapshot, payload)).toBe(false)
  })

  it('rejects concurrent branches in the proposal version chain', async () => {
    await seedUser(testDb.db, { id: 1 })
    const firstId = await createProposal()
    const child = await testDb.db.insert(testDb.schema.quoteCorrectionProposals).values({
      quoteId: 1, targetType: 'quote', targetId: 1, version: 2, previousProposalId: firstId,
      payload: '{}', fingerprint: 'fingerprint-v2', proposedBy: 1,
    }).returning({ id: testDb.schema.quoteCorrectionProposals.id })
    expect(child).toHaveLength(1)
    await expect(testDb.db.insert(testDb.schema.quoteCorrectionProposals).values({
      quoteId: 1, targetType: 'quote', targetId: 1, version: 2, previousProposalId: firstId,
      payload: '{}', fingerprint: 'fingerprint-v3', proposedBy: 1,
    })).rejects.toThrow()
  })
})
