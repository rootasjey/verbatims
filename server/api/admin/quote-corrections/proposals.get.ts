import { and, desc, eq, inArray, lt } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const query = getQuery(event)
  const proposalId = query.proposal_id === undefined ? undefined : Number(query.proposal_id)
  const beforeId = query.before_id === undefined ? undefined : Number(query.before_id)
  const requestedLimit = query.limit === undefined ? 50 : Number(query.limit)
  if (proposalId !== undefined && (!Number.isSafeInteger(proposalId) || proposalId < 1)) throwServer(400, 'Invalid proposal_id')
  if (beforeId !== undefined && (!Number.isSafeInteger(beforeId) || beforeId < 1)) throwServer(400, 'Invalid before_id')
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) throwServer(400, 'Invalid limit')
  const limit = proposalId ? 1 : Math.min(requestedLimit, 100)
  const filters = [
    proposalId ? eq(schema.quoteCorrectionProposals.id, proposalId) : undefined,
    beforeId ? lt(schema.quoteCorrectionProposals.id, beforeId) : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter))
  const proposals = await db.select().from(schema.quoteCorrectionProposals)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(schema.quoteCorrectionProposals.id)).limit(limit + (proposalId ? 0 : 1)).all()
  if (proposalId && !proposals.length) throwServer(404, 'Proposal not found')
  const hasMore = !proposalId && proposals.length > limit
  if (hasMore) proposals.pop()
  const ids = proposals.map(proposal => proposal.id)
  const decisions = ids.length ? await db.select().from(schema.quoteCorrectionDecisions).where(inArray(schema.quoteCorrectionDecisions.proposalId, ids)).all() : []
  const attempts = ids.length ? await db.select().from(schema.quoteCorrectionApplyAttempts).where(inArray(schema.quoteCorrectionApplyAttempts.proposalId, ids)).all() : []
  return { success: true, data: proposals.map(proposal => ({
    ...proposal,
    decisions: decisions.filter(decision => decision.proposalId === proposal.id),
    attempts: attempts.filter(attempt => attempt.proposalId === proposal.id),
  })), next_before_id: hasMore ? proposals[proposals.length - 1]?.id ?? null : null }
})
