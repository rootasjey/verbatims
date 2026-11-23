import { desc, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const proposals = await db.select().from(schema.quoteCorrectionProposals).orderBy(desc(schema.quoteCorrectionProposals.id)).limit(100).all()
  const ids = proposals.map(proposal => proposal.id)
  const decisions = ids.length ? await db.select().from(schema.quoteCorrectionDecisions).where(inArray(schema.quoteCorrectionDecisions.proposalId, ids)).all() : []
  const attempts = ids.length ? await db.select().from(schema.quoteCorrectionApplyAttempts).where(inArray(schema.quoteCorrectionApplyAttempts.proposalId, ids)).all() : []
  return { success: true, data: proposals.map(proposal => ({
    ...proposal,
    decisions: decisions.filter(decision => decision.proposalId === proposal.id),
    attempts: attempts.filter(attempt => attempt.proposalId === proposal.id),
  })) }
})
