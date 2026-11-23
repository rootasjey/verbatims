import { and, desc, eq, isNull, lt, notExists, or } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireModerator(event)
  const query = getQuery(event)
  const cursor = query.before_id === undefined ? undefined : Number(query.before_id)
  const requestedLimit = query.limit === undefined ? 50 : Number(query.limit)
  if (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 1)) throwServer(400, 'Invalid before_id')
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) throwServer(400, 'Invalid limit')
  const filters = [cursor ? lt(schema.quoteCorrectionApplyAttempts.id, cursor) : undefined]
  if (query.proposal_id === 'unmatched') filters.push(or(
    isNull(schema.quoteCorrectionApplyAttempts.proposalId),
    notExists(db.select({ id: schema.quoteCorrectionProposals.id }).from(schema.quoteCorrectionProposals)
      .where(eq(schema.quoteCorrectionProposals.id, schema.quoteCorrectionApplyAttempts.proposalId))),
  ))
  else if (query.proposal_id !== undefined) {
    const proposalId = Number(query.proposal_id)
    if (!Number.isSafeInteger(proposalId) || proposalId < 1) throwServer(400, 'Invalid proposal_id')
    filters.push(eq(schema.quoteCorrectionApplyAttempts.proposalId, proposalId))
  }
  const limit = Math.min(requestedLimit, 100)
  const conditions = filters.filter((filter): filter is NonNullable<typeof filter> => Boolean(filter))
  const attempts = await db.select().from(schema.quoteCorrectionApplyAttempts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.quoteCorrectionApplyAttempts.id)).limit(limit + 1).all()
  const hasMore = attempts.length > limit
  if (hasMore) attempts.pop()
  return { success: true, data: attempts, next_before_id: hasMore ? attempts[attempts.length - 1]?.id ?? null : null }
})
