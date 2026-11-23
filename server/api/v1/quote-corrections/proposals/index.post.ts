import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireApiPermission } from '~~/server/utils/api-key'
import { CORRECTION_FIELDS, correctionFingerprint, getCorrectionTarget, parseCorrectionPayload, snapshotQuoteSource, validateSourceCorrectionAfter, type CorrectionPayload, type CorrectionTarget } from '~~/server/utils/quote-correction'

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'propose:quote-corrections')
  const input = await readBody<Record<string, unknown>>(event)
  const targetType = input?.target_type
  if (!['quote', 'attribution', 'source'].includes(String(targetType))) throwServer(400, 'Invalid target_type')
  const target = targetType as CorrectionTarget
  const quoteId = Number(input.quote_id)
  const targetId = Number(input.target_id)
  if (!Number.isSafeInteger(quoteId) || quoteId < 1 || !Number.isSafeInteger(targetId) || targetId < 1) throwServer(400, 'Invalid quote or target ID')
  const current = await getCorrectionTarget(target, targetId, quoteId)
  if (!current || (target === 'quote' && targetId !== quoteId)) throwServer(404, 'Correction target not found')
  const parsedPayload = parseCorrectionPayload(input.payload, target)
  const evidence: CorrectionPayload['evidence'] = []
  for (const item of parsedPayload.evidence) {
    const source = await db.select().from(schema.quoteSources)
      .where(and(eq(schema.quoteSources.id, item.source_id), eq(schema.quoteSources.quoteId, quoteId))).get()
    if (!source || source.locatorType !== item.locator_type || source.locatorValue !== item.locator_value) throwServer(400, 'Evidence locator must match a source record on the target quote')
    evidence.push({ ...item, snapshot: snapshotQuoteSource(source) })
  }
  const payload = { ...parsedPayload, evidence }
  if (target === 'source') validateSourceCorrectionAfter(payload, current as unknown as Record<string, unknown>)
  const targetTable = target === 'quote' ? schema.quotes : target === 'attribution' ? schema.quoteAttributions : schema.quoteSources
  const fields = CORRECTION_FIELDS[target] as Record<string, unknown>
  for (const [field, change] of Object.entries(payload.changes)) {
    const column = fields[field]
    const propertyKey = Object.entries(targetTable).find(([, candidate]) => candidate === column)?.[0]
    if (!propertyKey || (current as unknown as Record<string, unknown>)[propertyKey] !== change.before) throwServer(409, `Current value does not match before value for ${field}`)
  }
  if (target === 'attribution') {
    const after = (field: 'author_id' | 'reference_id') => field in payload.changes
      ? payload.changes[field]!.after
      : (current as unknown as Record<string, unknown>)[field === 'author_id' ? 'authorId' : 'referenceId']
    if (after('author_id') == null && after('reference_id') == null) throwServer(400, 'An attribution must retain an author or reference')
    const authorId = after('author_id')
    if (authorId != null && !await db.select({ id: schema.authors.id }).from(schema.authors).where(eq(schema.authors.id, Number(authorId))).get()) throwServer(400, 'Invalid author_id')
    const referenceId = after('reference_id')
    if (referenceId != null && !await db.select({ id: schema.quoteReferences.id }).from(schema.quoteReferences).where(eq(schema.quoteReferences.id, Number(referenceId))).get()) throwServer(400, 'Invalid reference_id')
  }
  const previousId = input.previous_proposal_id == null ? null : Number(input.previous_proposal_id)
  let version = 1
  if (previousId !== null) {
    const previous = await db.select().from(schema.quoteCorrectionProposals)
      .where(eq(schema.quoteCorrectionProposals.id, previousId)).get()
    if (!previous || previous.quoteId !== quoteId || previous.targetType !== target || previous.targetId !== targetId) throwServer(400, 'Previous proposal must target the same record')
    const latest = await db.select({ id: schema.quoteCorrectionProposals.id, version: schema.quoteCorrectionProposals.version }).from(schema.quoteCorrectionProposals)
      .where(and(eq(schema.quoteCorrectionProposals.quoteId, quoteId), eq(schema.quoteCorrectionProposals.targetType, target), eq(schema.quoteCorrectionProposals.targetId, targetId)))
      .orderBy(desc(schema.quoteCorrectionProposals.version)).get()
    if (latest?.id !== previousId) throwServer(409, 'A new version must link to the latest proposal')
    version = previous.version + 1
  } else {
    const latest = await db.select({ version: schema.quoteCorrectionProposals.version }).from(schema.quoteCorrectionProposals)
      .where(and(eq(schema.quoteCorrectionProposals.quoteId, quoteId), eq(schema.quoteCorrectionProposals.targetType, target), eq(schema.quoteCorrectionProposals.targetId, targetId)))
      .orderBy(desc(schema.quoteCorrectionProposals.version)).get()
    if (latest) throwServer(409, 'A new version must link to the previous proposal')
  }
  const immutable = { quote_id: quoteId, target_type: target, target_id: targetId, version, previous_proposal_id: previousId, payload }
  const fingerprint = await correctionFingerprint(immutable)
  const [created] = await db.insert(schema.quoteCorrectionProposals).values({
    quoteId, targetType: target, targetId, version, previousProposalId: previousId,
    payload: JSON.stringify(payload), fingerprint, proposedBy: api.userId,
  }).returning({ id: schema.quoteCorrectionProposals.id })
  setResponseStatus(event, 201)
  return { success: true, data: { ...immutable, id: created!.id, fingerprint } }
})
