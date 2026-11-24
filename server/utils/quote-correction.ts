import { and, eq, exists, isNull, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { normalizeTimecode } from '../../shared/utils/timecode'

export const CORRECTION_FIELDS = {
  quote: { name: schema.quotes.name, language: schema.quotes.language },
  attribution: {
    author_id: schema.quoteAttributions.authorId,
    reference_id: schema.quoteAttributions.referenceId,
    notes: schema.quoteAttributions.notes,
  },
  source: {
    source_type: schema.quoteSources.sourceType,
    source_medium: schema.quoteSources.sourceMedium,
    source_url: schema.quoteSources.sourceUrl,
    label: schema.quoteSources.label,
    locator_type: schema.quoteSources.locatorType,
    locator_value: schema.quoteSources.locatorValue,
    translator_name: schema.quoteSources.translatorName,
    notes: schema.quoteSources.notes,
  },
} as const

export type CorrectionTarget = keyof typeof CORRECTION_FIELDS
export function nestedErrorMessage(error: unknown) {
  const messages: string[] = []
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current && !seen.has(current) && messages.length < 5) {
    seen.add(current)
    if (current instanceof Error) {
      messages.push(current.message)
      current = current.cause
    } else if (typeof current === 'object' && 'message' in current && typeof current.message === 'string') {
      messages.push(current.message)
      current = 'cause' in current ? current.cause : null
    } else {
      break
    }
  }
  return messages.join(': ')
}

export type SourceSnapshot = {
  quote_id: number
  attribution_id: number | null
  occurrence_id: number | null
  source_type: string
  source_medium: string | null
  source_url: string | null
  label: string | null
  locator_type: string | null
  locator_value: string | null
  translator_name: string | null
  verification_status: string
  verified_by: number | null
  verified_at: string | null
  notes: string | null
  is_primary: boolean
  created_by: number | null
}
export type CorrectionPayload = {
  changes: Record<string, { before: unknown, after: unknown }>
  evidence: Array<{ source_id: number, locator_type: string, locator_value: string, snapshot?: SourceSnapshot }>
}

export function parseCorrectionPayload(value: unknown, target: CorrectionTarget): CorrectionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throwServer(400, 'Invalid proposal payload')
  const input = value as Record<string, unknown>
  if (!input.changes || typeof input.changes !== 'object' || Array.isArray(input.changes)) throwServer(400, 'Changes must be an object')
  const changes = input.changes as Record<string, { before?: unknown, after?: unknown }>
  const parsedChanges: CorrectionPayload['changes'] = {}
  const allowed = CORRECTION_FIELDS[target] as Record<string, unknown>
  const names = Object.keys(changes)
  if (!names.length) throwServer(400, 'At least one field change is required')
  for (const name of names) {
    const change = changes[name]
    if (!Object.hasOwn(allowed, name) || !change || typeof change !== 'object' || !('before' in change) || !('after' in change)) {
      throwServer(400, `Field is not allowed or change is incomplete: ${name}`)
    }
    if (JSON.stringify(change.before) === JSON.stringify(change.after)) throwServer(400, `Field has no change: ${name}`)
    assertFieldValue(target, name, change.before, true)
    assertFieldValue(target, name, change.after, false)
    parsedChanges[name] = { before: change.before, after: change.after }
  }
  if (!Array.isArray(input.evidence) || input.evidence.length < 1) throwServer(400, 'At least one source locator is required')
  if (input.evidence.length > 4) throwServer(400, 'At most four evidence locators are supported per proposal')
  const evidence = input.evidence.map((item) => {
    if (!item || typeof item !== 'object') throwServer(400, 'Invalid evidence locator')
    const locator = item as Record<string, unknown>
    if (!Number.isSafeInteger(locator.source_id) || Number(locator.source_id) < 1
      || !['page', 'chapter', 'timecode'].includes(String(locator.locator_type))
      || typeof locator.locator_value !== 'string' || !locator.locator_value.trim() || locator.locator_value.length > 250) throwServer(400, 'Evidence requires a valid exact locator')
    const evidenceItem: CorrectionPayload['evidence'][number] = {
      source_id: Number(locator.source_id), locator_type: String(locator.locator_type), locator_value: locator.locator_value.trim(),
    }
    if (locator.snapshot !== undefined) evidenceItem.snapshot = parseSourceSnapshot(locator.snapshot)
    return evidenceItem
  })
  return { changes: parsedChanges, evidence }
}

function assertFieldValue(target: CorrectionTarget, name: string, value: unknown, before: boolean) {
  if (value === null) {
    if ((target === 'quote' && name !== 'language') || (target === 'attribution' && name !== 'notes' && !['author_id', 'reference_id'].includes(name)) || (target === 'source' && name === 'source_type')) throwServer(400, `${name} cannot be null`)
    return
  }
  if (target === 'attribution' && ['author_id', 'reference_id'].includes(name)) {
    if (!Number.isSafeInteger(value) || Number(value) < 1) throwServer(400, `${name} must be a positive integer or null`)
    return
  }
  if (typeof value !== 'string') {
    throwServer(400, `Invalid value for ${name}`)
  }
  const maxLengths: Record<string, number> = { name: 4000, language: 10, notes: 5000, source_type: 100, source_medium: 20, source_url: 2000, label: 200, locator_type: 20, locator_value: 250, translator_name: 200 }
  if (value.length > (maxLengths[name] ?? 5000)) throwServer(400, `${name} is too long`)
  if (target === 'quote' && name === 'name' && !before && value.trim().length < 2) throwServer(400, 'Quote text must contain at least two characters')
  if (target === 'quote' && name === 'language' && value !== null && !['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la'].includes(value)) throwServer(400, 'Invalid quote language')
  if (!before && target === 'source' && name === 'source_medium' && !['book', 'web_page', 'transcript', 'audio', 'audiovisual', 'document', 'other'].includes(value)) throwServer(400, 'Invalid source medium')
  if (!before && target === 'source' && name === 'locator_type' && !['page', 'chapter', 'timecode'].includes(value)) throwServer(400, 'Invalid locator type')
  if (!before && target === 'source' && name === 'source_type' && !value.trim()) throwServer(400, 'Source type cannot be empty')
  if (target === 'source' && name === 'source_url' && !before) {
    try { new URL(value) } catch { throwServer(400, 'Source URL must be absolute') }
  }
  if (target === 'source' && name === 'locator_value' && !before && value.trim().length === 0) throwServer(400, 'Locator value cannot be empty')
}

function parseSourceSnapshot(value: unknown): SourceSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throwServer(400, 'Invalid source snapshot')
  const snapshot = value as Record<string, unknown>
  const nullableString = (field: string) => snapshot[field] === null || typeof snapshot[field] === 'string'
  const nullableId = (field: string) => snapshot[field] === null || Number.isSafeInteger(snapshot[field])
  if (!Number.isSafeInteger(snapshot.quote_id)
    || !nullableId('attribution_id') || !nullableId('occurrence_id') || !nullableId('verified_by') || !nullableId('created_by')
    || typeof snapshot.source_type !== 'string' || typeof snapshot.verification_status !== 'string'
    || !['unverified', 'manually_verified', 'externally_verified', 'disputed'].includes(snapshot.verification_status)
    || typeof snapshot.is_primary !== 'boolean'
    || !['source_medium', 'source_url', 'label', 'locator_type', 'locator_value', 'translator_name', 'verified_at', 'notes'].every(nullableString)) {
    throwServer(400, 'Incomplete source snapshot')
  }
  return {
    quote_id: Number(snapshot.quote_id), attribution_id: snapshot.attribution_id as number | null,
    occurrence_id: snapshot.occurrence_id as number | null, source_type: snapshot.source_type,
    source_medium: snapshot.source_medium as string | null, source_url: snapshot.source_url as string | null,
    label: snapshot.label as string | null, locator_type: snapshot.locator_type as string | null,
    locator_value: snapshot.locator_value as string | null, translator_name: snapshot.translator_name as string | null,
    verification_status: snapshot.verification_status, verified_by: snapshot.verified_by as number | null,
    verified_at: snapshot.verified_at as string | null, notes: snapshot.notes as string | null,
    is_primary: snapshot.is_primary, created_by: snapshot.created_by as number | null,
  }
}

export function snapshotQuoteSource(source: typeof schema.quoteSources.$inferSelect): SourceSnapshot {
  return {
    quote_id: source.quoteId, attribution_id: source.attributionId, occurrence_id: source.occurrenceId,
    source_type: source.sourceType, source_medium: source.sourceMedium, source_url: source.sourceUrl,
    label: source.label, locator_type: source.locatorType, locator_value: source.locatorValue,
    translator_name: source.translatorName, verification_status: source.verificationStatus,
    verified_by: source.verifiedBy, verified_at: timestampSnapshot(source.verifiedAt),
    notes: source.notes, is_primary: source.isPrimary, created_by: source.createdBy,
  }
}

export function evidenceLocatorMatchesSnapshotOrRepair(
  target: CorrectionTarget,
  targetId: number,
  item: CorrectionPayload['evidence'][number],
  snapshot: SourceSnapshot,
  payload: CorrectionPayload,
) {
  if (snapshot.locator_type === item.locator_type && snapshot.locator_value === item.locator_value) return true
  if (target !== 'source' || item.source_id !== targetId || !('locator_type' in payload.changes || 'locator_value' in payload.changes)) return false
  const resultingType = 'locator_type' in payload.changes ? payload.changes.locator_type!.after : snapshot.locator_type
  const resultingValue = 'locator_value' in payload.changes ? payload.changes.locator_value!.after : snapshot.locator_value
  return resultingType === item.locator_type && resultingValue === item.locator_value
}

function timestampSnapshot(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value * 1000 : String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

export function validateSourceCorrectionAfter(payload: CorrectionPayload, current: Record<string, unknown>) {
  const after = (field: string, currentKey: string) => field in payload.changes ? payload.changes[field]!.after : current[currentKey]
  const sourceUrl = after('source_url', 'sourceUrl')
  const label = after('label', 'label')
  const locatorType = after('locator_type', 'locatorType')
  let locatorValue = after('locator_value', 'locatorValue')
  if (!sourceUrl && !label) throwServer(400, 'A source requires a URL or label')
  if (Boolean(locatorType) !== Boolean(locatorValue)) throwServer(400, 'A locator requires both a type and value')
  if (locatorType === 'timecode' && typeof locatorValue === 'string') {
    const normalized = normalizeTimecode(locatorValue)
    if (!normalized) throwServer(400, 'Use MM:SS or HH:MM:SS with seconds below 60')
    if (locatorValue !== normalized) {
      if (!('locator_value' in payload.changes)) throwServer(400, 'Include locator_value when normalizing a timecode')
      payload.changes.locator_value!.after = normalized
    }
    for (const item of payload.evidence) {
      if (item.source_id !== Number(current.id) || item.locator_type !== 'timecode'
        || !('locator_type' in payload.changes || 'locator_value' in payload.changes)) continue
      const normalizedEvidence = normalizeTimecode(item.locator_value)
      if (!normalizedEvidence) throwServer(400, 'Evidence timecode must use MM:SS or HH:MM:SS with seconds below 60')
      item.locator_value = normalizedEvidence
    }
  }
  for (const [field, change] of Object.entries(payload.changes)) {
    if (JSON.stringify(change.before) === JSON.stringify(change.after)) throwServer(400, `Field has no change after normalization: ${field}`)
  }
}

export function sourceSnapshotMatchesCondition(sourceId: number, snapshot: SourceSnapshot) {
  const conditions = [
    eq(schema.quoteSources.id, sourceId),
    eq(schema.quoteSources.quoteId, snapshot.quote_id),
    eq(schema.quoteSources.sourceType, snapshot.source_type),
    nullableMatch(schema.quoteSources.attributionId, snapshot.attribution_id),
    nullableMatch(schema.quoteSources.occurrenceId, snapshot.occurrence_id),
    nullableMatch(schema.quoteSources.sourceMedium, snapshot.source_medium),
    nullableMatch(schema.quoteSources.sourceUrl, snapshot.source_url),
    nullableMatch(schema.quoteSources.label, snapshot.label),
    nullableMatch(schema.quoteSources.locatorType, snapshot.locator_type),
    nullableMatch(schema.quoteSources.locatorValue, snapshot.locator_value),
    nullableMatch(schema.quoteSources.translatorName, snapshot.translator_name),
    eq(schema.quoteSources.verificationStatus, snapshot.verification_status as 'unverified' | 'manually_verified' | 'externally_verified' | 'disputed'),
    nullableMatch(schema.quoteSources.verifiedBy, snapshot.verified_by),
    snapshot.verified_at === null
      ? isNull(schema.quoteSources.verifiedAt)
      : sql`CASE WHEN typeof(${schema.quoteSources.verifiedAt}) = 'integer' THEN datetime(${schema.quoteSources.verifiedAt}, 'unixepoch') ELSE datetime(${schema.quoteSources.verifiedAt}) END = datetime(${snapshot.verified_at})`,
    nullableMatch(schema.quoteSources.notes, snapshot.notes),
    eq(schema.quoteSources.isPrimary, snapshot.is_primary),
    nullableMatch(schema.quoteSources.createdBy, snapshot.created_by),
  ]
  return exists(db.select({ id: schema.quoteSources.id }).from(schema.quoteSources).where(and(...conditions)))
}

function nullableMatch(column: any, value: unknown) {
  return value === null ? isNull(column) : eq(column, value as never)
}

export async function correctionFingerprint(payload: unknown) {
  const canonical = JSON.stringify(payload)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function getCorrectionTarget(target: CorrectionTarget, targetId: number, quoteId: number) {
  if (target === 'quote') return db.select().from(schema.quotes).where(eq(schema.quotes.id, targetId)).get()
  if (target === 'attribution') return db.select().from(schema.quoteAttributions)
    .where(and(eq(schema.quoteAttributions.id, targetId), eq(schema.quoteAttributions.quoteId, quoteId))).get()
  return db.select().from(schema.quoteSources)
    .where(and(eq(schema.quoteSources.id, targetId), eq(schema.quoteSources.quoteId, quoteId))).get()
}

export function correctionTargetIdColumn(target: CorrectionTarget) {
  if (target === 'quote') return schema.quotes.id
  if (target === 'attribution') return schema.quoteAttributions.id
  return schema.quoteSources.id
}
