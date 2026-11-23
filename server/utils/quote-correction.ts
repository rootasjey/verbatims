import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

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
export type CorrectionPayload = {
  changes: Record<string, { before: unknown, after: unknown }>
  evidence: Array<{ source_id: number, locator_type: string, locator_value: string }>
}

export function parseCorrectionPayload(value: unknown, target: CorrectionTarget): CorrectionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throwServer(400, 'Invalid proposal payload')
  const input = value as Record<string, unknown>
  if (!input.changes || typeof input.changes !== 'object' || Array.isArray(input.changes)) throwServer(400, 'Changes must be an object')
  const changes = input.changes as Record<string, { before?: unknown, after?: unknown }>
  const allowed = CORRECTION_FIELDS[target] as Record<string, unknown>
  const names = Object.keys(changes)
  if (!names.length) throwServer(400, 'At least one field change is required')
  for (const name of names) {
    const change = changes[name]
    if (!(name in allowed) || !change || typeof change !== 'object' || !('before' in change) || !('after' in change)) {
      throwServer(400, `Field is not allowed or change is incomplete: ${name}`)
    }
    if (JSON.stringify(change.before) === JSON.stringify(change.after)) throwServer(400, `Field has no change: ${name}`)
    assertFieldValue(target, name, change.before)
    assertFieldValue(target, name, change.after)
  }
  if (!Array.isArray(input.evidence) || input.evidence.length < 1) throwServer(400, 'At least one source locator is required')
  const evidence = input.evidence.map((item) => {
    if (!item || typeof item !== 'object') throwServer(400, 'Invalid evidence locator')
    const locator = item as Record<string, unknown>
    if (!Number.isSafeInteger(locator.source_id) || Number(locator.source_id) < 1
      || typeof locator.locator_type !== 'string' || !locator.locator_type.trim()
      || typeof locator.locator_value !== 'string' || !locator.locator_value.trim()) throwServer(400, 'Evidence requires source_id and an exact locator')
    return { source_id: Number(locator.source_id), locator_type: locator.locator_type.trim(), locator_value: locator.locator_value.trim() }
  })
  return { changes, evidence }
}

function assertFieldValue(target: CorrectionTarget, name: string, value: unknown) {
  if (value === null) {
    if (target === 'quote' || (target === 'attribution' && name !== 'notes' && !['author_id', 'reference_id'].includes(name)) || (target === 'source' && name === 'source_type')) throwServer(400, `${name} cannot be null`)
    return
  }
  if (typeof value !== 'string' && !(target === 'attribution' && ['author_id', 'reference_id'].includes(name) && Number.isSafeInteger(value))) {
    throwServer(400, `Invalid value for ${name}`)
  }
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
