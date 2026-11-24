import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { getAuditedBatchRow, runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { CORRECTION_FIELDS, correctionTargetIdColumn, evidenceLocatorMatchesSnapshotOrRepair, getCorrectionTarget, nestedErrorMessage, parseCorrectionPayload, sourceSnapshotMatchesCondition, validateSourceCorrectionAfter, type CorrectionTarget } from '~~/server/utils/quote-correction'

export default defineEventHandler(async (event) => {
  const api = event.context.api
  const proposalId = Number(getRouterParam(event, 'id'))
  let proposal: typeof schema.quoteCorrectionProposals.$inferSelect | undefined
  let applicationCommitted = false
  try {
    if (!Number.isSafeInteger(proposalId) || proposalId < 1) throwServer(400, 'Invalid proposal ID')
    if (!api?.permissions.includes('apply:quote-corrections')) throwServer(403, 'API key missing required permission: apply:quote-corrections')
    proposal = await db.select().from(schema.quoteCorrectionProposals).where(eq(schema.quoteCorrectionProposals.id, proposalId)).get()
    if (!proposal) throwServer(404, 'Proposal not found')
    if (proposal.appliedAt) {
      await logAttempt(proposalId, proposal.fingerprint, api.userId, api.id, event, 'already_applied', 'Proposal was already applied')
      return { success: true, result: 'already_applied', proposal_id: proposalId }
    }
    const payload = parseCorrectionPayload(JSON.parse(proposal.payload), proposal.targetType as CorrectionTarget)
    const decision = await db.select().from(schema.quoteCorrectionDecisions)
      .where(and(
        eq(schema.quoteCorrectionDecisions.proposalId, proposalId),
        eq(schema.quoteCorrectionDecisions.fingerprint, proposal.fingerprint),
        eq(schema.quoteCorrectionDecisions.decision, 'approved'),
      )).orderBy(desc(schema.quoteCorrectionDecisions.id)).get()
    if (!decision || !decision.expiresAt || decision.expiresAt.getTime() <= Date.now()) throwServer(409, 'A current human approval is required')
    const target = proposal.targetType as CorrectionTarget
    const decisionGuards = [
      sql`EXISTS (SELECT 1 FROM quote_correction_decisions WHERE proposal_id = ${proposalId} AND fingerprint = ${proposal.fingerprint} AND decision = 'approved' AND expires_at > unixepoch())`,
      sql`NOT EXISTS (SELECT 1 FROM quote_correction_decisions WHERE proposal_id = ${proposalId} AND decision = 'rejected')`,
    ]
    const evidenceGuards = payload.evidence.map((item) => {
      if (!item.snapshot || item.snapshot.quote_id !== proposal!.quoteId
        || !evidenceLocatorMatchesSnapshotOrRepair(target, proposal!.targetId, item, item.snapshot, payload)) {
        throwServer(409, 'Approved source evidence is incomplete or inconsistent')
      }
      return sourceSnapshotMatchesCondition(item.source_id, item.snapshot)
    })
    const current = await getCorrectionTarget(target, proposal.targetId, proposal.quoteId)
    if (!current) throwServer(409, 'Correction target no longer exists')
    if (target === 'source') validateSourceCorrectionAfter(payload, current as unknown as Record<string, unknown>)
    const fieldMap = CORRECTION_FIELDS[target] as Record<string, any>
    const targetTable = target === 'quote' ? schema.quotes : target === 'attribution' ? schema.quoteAttributions : schema.quoteSources
    const beforeConditions = []
    const updates: Record<string, unknown> = {}
    for (const [field, change] of Object.entries(payload.changes)) {
      const property = fieldMap[field]
      const propertyKey = Object.entries(targetTable).find(([, column]) => column === property)?.[0]
      if (!property || !propertyKey || (current as unknown as Record<string, unknown>)[propertyKey] !== change.before) throwServer(409, `Current value changed for ${field}`)
      beforeConditions.push(change.before === null ? sql`${property} IS NULL` : eq(property, change.before))
      updates[propertyKey] = change.after
    }
    if (target === 'attribution') {
      const after = (field: 'author_id' | 'reference_id') => field in payload.changes
        ? payload.changes[field]!.after
        : (current as unknown as Record<string, unknown>)[field === 'author_id' ? 'authorId' : 'referenceId']
      if (after('author_id') == null && after('reference_id') == null) throwServer(409, 'An attribution must retain an author or reference')
    }
    if (target === 'source') {
      updates.verificationStatus = 'unverified'
      updates.verifiedBy = null
      updates.verifiedAt = null
    } else if (target === 'attribution') {
      updates.status = 'unverified'
      updates.verifiedBy = null
      updates.verifiedAt = null
    }
    const appliedAt = new Date()
    const applicationId = crypto.randomUUID()
    updates.updatedAt = appliedAt
    const idColumn = correctionTargetIdColumn(target)
    const mutationConditions = [...beforeConditions, ...evidenceGuards, ...decisionGuards]
    const mutation = target === 'quote'
      ? db.update(schema.quotes).set(updates as any).where(and(eq(idColumn, proposal.targetId), ...mutationConditions)).returning({ id: idColumn })
      : target === 'attribution'
        ? db.update(schema.quoteAttributions).set(updates as any).where(and(eq(idColumn, proposal.targetId), eq(schema.quoteAttributions.quoteId, proposal.quoteId), ...mutationConditions)).returning({ id: idColumn })
        : db.update(schema.quoteSources).set(updates as any).where(and(eq(idColumn, proposal.targetId), eq(schema.quoteSources.quoteId, proposal.quoteId), ...mutationConditions)).returning({ id: idColumn })
    const markApplied = db.update(schema.quoteCorrectionProposals).set({ appliedAt, applicationId })
      .where(and(eq(schema.quoteCorrectionProposals.id, proposalId), eq(schema.quoteCorrectionProposals.fingerprint, proposal.fingerprint), isNull(schema.quoteCorrectionProposals.appliedAt)))
      .returning({ id: schema.quoteCorrectionProposals.id })
    const successAttempt = db.insert(schema.quoteCorrectionApplyAttempts).values({
      proposalId, fingerprint: proposal.fingerprint, actorUserId: api.userId, apiKeyId: api.id, applicationId,
      requestId: getHeader(event, 'x-request-id') || getHeader(event, 'cf-ray') || null,
      outcome: 'applied_unverified', reason: 'Mutation committed; post-application verification pending',
    }).returning({ id: schema.quoteCorrectionApplyAttempts.id })
    const results = await runApiAuditedBatch(event, api, [mutation, markApplied, successAttempt], applicationId)
    applicationCommitted = true
    getAuditedBatchRow<{ id: number }>(results, 1)
    getAuditedBatchRow<{ id: number }>(results, 2)
    getAuditedBatchRow<{ id: number }>(results, 3)
    let reread: Awaited<ReturnType<typeof getCorrectionTarget>> | null = null
    let verificationReason: string | null = null
    try {
      reread = await getCorrectionTarget(target, proposal.targetId, proposal.quoteId)
      if (!reread) verificationReason = 'Post-application target could not be reread'
    } catch (error) {
      verificationReason = error instanceof Error ? `Post-application reread failed: ${error.message.slice(0, 350)}` : 'Post-application reread failed'
    }
    const verified = Boolean(reread && Object.entries(payload.changes).every(([field, change]) => {
      const propertyKey = Object.entries(targetTable).find(([, column]) => column === fieldMap[field])?.[0]
      return Boolean(propertyKey && (reread as unknown as Record<string, unknown>)[propertyKey] === change.after)
    }))
    if (!verified && !verificationReason) verificationReason = 'Post-application values diverged on reread'
    await logAttempt(proposalId, proposal.fingerprint, api.userId, api.id, event,
      verified ? 'verified' : 'verification_failed', verificationReason, applicationId)
    return { success: true, result: 'applied', proposal_id: proposalId, applied_at: appliedAt, verified }
  } catch (error) {
    const statusCode = Number((error as { statusCode?: number })?.statusCode)
    const reason = nestedErrorMessage(error).slice(0, 500) || 'Application failed'
    if (applicationCommitted) throwServer(500, 'Correction was committed; its applied_unverified attempt records the result')
    if (proposal) {
      const latest = await db.select({ appliedAt: schema.quoteCorrectionProposals.appliedAt }).from(schema.quoteCorrectionProposals)
        .where(eq(schema.quoteCorrectionProposals.id, proposal.id)).get()
      if (latest?.appliedAt) {
        await logAttempt(proposal.id, proposal.fingerprint, api?.userId ?? null, api?.id ?? null, event, 'already_applied', 'Proposal was applied by a concurrent request')
        return { success: true, result: 'already_applied', proposal_id: proposal.id }
      }
    }
    await logAttempt(proposal?.id ?? (Number.isSafeInteger(proposalId) ? proposalId : null), proposal?.fingerprint ?? null, api?.userId ?? null, api?.id ?? null, event, statusCode === 403 ? 'denied' : 'refused', reason)
    if (reason.includes('Quote correction mutation was not applied') || reason.includes('Attribution correction mutation was not applied')
      || reason.includes('Source correction mutation was not applied') || reason.includes('current approval without rejection')
      || reason.includes('Correction mutation audit record is missing')) {
      throwServer(409, 'Approval, evidence, or current values changed before application')
    }
    throw error
  }
})

async function logAttempt(proposalId: number | null, fingerprint: string | null, actorUserId: number | null, apiKeyId: number | null, event: any, outcome: string, reason: string | null, applicationId: string | null = null) {
  await db.insert(schema.quoteCorrectionApplyAttempts).values({
    proposalId, fingerprint, actorUserId, apiKeyId, applicationId,
    requestId: getHeader(event, 'x-request-id') || getHeader(event, 'cf-ray') || null,
    outcome, reason,
  }).run()
}
