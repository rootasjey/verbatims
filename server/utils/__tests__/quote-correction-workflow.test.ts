import { beforeEach, describe, expect, it, vi } from 'vitest'
import { and, eq, isNull } from 'drizzle-orm'
import { createTestDb, seedQuote, seedUser } from './test-db'
import type { TestDb } from './test-db'
import { sourceSnapshotMatchesCondition, snapshotQuoteSource } from '../quote-correction'

let testDb: TestDb

vi.mock('hub:db', async () => ({
  get db() { return testDb.db },
  schema: await import('../../db/schema'),
}))

beforeEach(() => {
  testDb = createTestDb()
})

async function createProposal(proposedBy = 1) {
  const [proposal] = await testDb.db.insert(testDb.schema.quoteCorrectionProposals).values({
    quoteId: 1,
    targetType: 'quote',
    targetId: 1,
    version: 1,
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
    })).rejects.toThrow('decision is no longer valid')

    const activeProposalId = await createProposal()
    await testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId: activeProposalId, fingerprint: 'fingerprint-v1', decision: 'approved', decidedBy: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    await expect(testDb.db.insert(testDb.schema.quoteCorrectionDecisions).values({
      proposalId: activeProposalId, fingerprint: 'fingerprint-v1', decision: 'rejected', decidedBy: 2, reason: 'Concurrent rejection',
    })).rejects.toThrow('decision is no longer valid')
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
    await testDb.db.batch([
      testDb.db.update(testDb.schema.quotes).set({ name: 'After', updatedAt: appliedAt }).where(eq(testDb.schema.quotes.id, 1)),
      testDb.db.insert(testDb.schema.quoteEditorialAuditEvents).values({
        action: 'update', targetType: 'quote', targetId: '1', requestId: applicationId, source: 'api_v1',
      }),
      testDb.db.update(testDb.schema.quoteCorrectionProposals).set({ appliedAt, applicationId }).where(and(
        eq(testDb.schema.quoteCorrectionProposals.id, proposalId),
        isNull(testDb.schema.quoteCorrectionProposals.appliedAt),
      )),
      testDb.db.insert(testDb.schema.quoteCorrectionApplyAttempts).values({
        proposalId, fingerprint: 'fingerprint-v1', applicationId, outcome: 'applied', actorUserId: 2,
      }),
    ] as any)

    const quote = await testDb.db.select().from(testDb.schema.quotes).where(eq(testDb.schema.quotes.id, 1)).get()
    const proposal = await testDb.db.select().from(testDb.schema.quoteCorrectionProposals).where(eq(testDb.schema.quoteCorrectionProposals.id, proposalId)).get()
    const attempts = await testDb.db.select().from(testDb.schema.quoteCorrectionApplyAttempts).where(eq(testDb.schema.quoteCorrectionApplyAttempts.proposalId, proposalId)).all()
    expect(quote?.name).toBe('After')
    expect(proposal?.appliedAt).toBeInstanceOf(Date)
    expect(attempts.map(attempt => attempt.outcome)).toEqual(['applied'])
    await expect(testDb.db.insert(testDb.schema.quoteCorrectionApplyAttempts).values({
      proposalId, fingerprint: 'fingerprint-v1', applicationId: 'different-application', outcome: 'applied', actorUserId: 2,
    })).rejects.toThrow('Applied result requires an applied proposal')
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
    ] as any)).rejects.toThrow('Quote correction mutation was not applied')

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
})
