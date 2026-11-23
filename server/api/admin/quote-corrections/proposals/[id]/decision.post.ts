import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  if (user.role !== 'moderator' && user.role !== 'admin') throwServer(403, 'Moderator or admin access required')
  const proposalId = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(proposalId) || proposalId < 1) throwServer(400, 'Invalid proposal ID')
  const body = await readBody<{ decision?: unknown, reason?: unknown }>(event)
  if (body.decision !== 'approved' && body.decision !== 'rejected') throwServer(400, 'Decision must be approved or rejected')
  const proposal = await db.select().from(schema.quoteCorrectionProposals).where(eq(schema.quoteCorrectionProposals.id, proposalId)).get()
  if (!proposal) throwServer(404, 'Proposal not found')
  if (proposal.appliedAt) throwServer(409, 'An applied proposal cannot receive another decision')
  if (body.decision === 'approved' && proposal.proposedBy === user.id) throwServer(403, 'The proposer cannot approve their own proposal')
  const latest = await db.select().from(schema.quoteCorrectionDecisions)
    .where(eq(schema.quoteCorrectionDecisions.proposalId, proposalId))
    .orderBy(desc(schema.quoteCorrectionDecisions.id)).get()
  if (latest?.decision === 'rejected') throwServer(409, 'Rejected proposals cannot be decided again')
  if (latest?.decision === 'approved' && latest.expiresAt && latest.expiresAt.getTime() > Date.now()) throwServer(409, 'Proposal already has a valid approval')
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : ''
  if (body.decision === 'rejected' && !reason) throwServer(400, 'A rejection reason is required')
  const decidedAt = new Date()
  const expiresAt = body.decision === 'approved' ? new Date(decidedAt.getTime() + 24 * 60 * 60 * 1000) : null
  let decision: { id: number } | undefined
  try {
    [decision] = await db.insert(schema.quoteCorrectionDecisions).values({
      proposalId, fingerprint: proposal.fingerprint, decision: body.decision,
      decidedBy: user.id, decidedAt, expiresAt, reason: body.decision === 'rejected' ? reason : null,
    }).returning({ id: schema.quoteCorrectionDecisions.id })
  } catch (error) {
    if (error instanceof Error && error.message.includes('decision is no longer valid')) {
      throwServer(409, 'A rejection is final or another decision is still active')
    }
    throw error
  }
  return { success: true, data: { id: decision!.id, proposal_id: proposalId, fingerprint: proposal.fingerprint, decision: body.decision, decided_at: decidedAt, expires_at: expiresAt, reason: body.decision === 'rejected' ? reason : null } }
})
