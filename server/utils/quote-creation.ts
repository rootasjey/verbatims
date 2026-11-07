import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import type { CreateQuoteSourceData } from '~~/shared/types/quote'
import { authorLifeDateColumnsFromInput } from './author-life-date'

type AttributionStatus = 'unverified' | 'manually_verified' | 'externally_verified' | 'disputed'

type InlineAuthor = {
  name: string
  isFictional?: boolean
  job?: string | null
  description?: string | null
  birth_date?: string
  birth_year?: number | null
  birth_era?: 'bce' | 'ce'
  birth_month?: number | null
  birth_day?: number | null
  birth_is_approximate?: boolean
  birth_calendar?: string
  birth_location?: string
  death_date?: string
  death_year?: number | null
  death_era?: 'bce' | 'ce'
  death_month?: number | null
  death_day?: number | null
  death_is_approximate?: boolean
  death_calendar?: string
  death_location?: string
  image_url?: string
}

type InlineReference = {
  name: string
  originalLanguage?: string
  primaryType: string
  description?: string | null
  releaseDate?: string | null
}

type AdditionalAttribution = {
  authorId: number | null
  referenceId: number | null
  status: AttributionStatus
  notes?: string | null
}

export type QuoteCreationBatchInput = {
  requestKey: string
  userId: number
  payloadHash: string
  quote: { name: string; language: string; status?: 'draft' | 'harvested' }
  authorId: number | null
  referenceId: number | null
  newAuthor?: InlineAuthor
  newReference?: InlineReference
  primaryAttribution: {
    status: AttributionStatus
    notes?: string | null
    verifiedBy?: number | null
  }
  additionalAttributions?: AdditionalAttribution[]
  sources?: CreateQuoteSourceData[]
  sourcesArePrimary?: boolean
  tagIds?: number[]
  activitySource?: string
  retainIdempotencyRecord?: boolean
}

export function normalizeQuoteCreationRequestKey(value?: string | null) {
  const requestKey = value?.trim() || crypto.randomUUID()
  if (requestKey.length > 128 || !/^[\w.:+-]+$/.test(requestKey)) {
    throwServer(400, 'Invalid Idempotency-Key')
  }
  return requestKey
}

export function scopeQuoteCreationRequestKey(requestKey: string, userId: number) {
  return `${userId}:${requestKey}`
}

export async function hashQuoteCreationPayload(value: unknown) {
  const serialized = stableSerialize(value)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function findQuoteCreationRequest(requestKey: string, userId: number, payloadHash: string) {
  const scopedKey = scopeQuoteCreationRequestKey(requestKey, userId)
  const request = await db.select({
    userId: schema.quoteCreationRequests.userId,
    quoteId: schema.quoteCreationRequests.quoteId,
    payloadHash: schema.quoteCreationRequests.payloadHash,
  })
    .from(schema.quoteCreationRequests)
    .where(eq(schema.quoteCreationRequests.requestKey, scopedKey))
    .get()
  if (request && request.payloadHash !== payloadHash) {
    throwServer(409, 'Idempotency-Key has already been used with a different payload')
  }
  return request
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

export function buildQuoteCreationStatements(input: QuoteCreationBatchInput) {
  const { requestKey } = input
  const field = (column: 'author_id' | 'reference_id' | 'quote_id' | 'primary_attribution_id') =>
    sql`(SELECT ${sql.raw(column)} FROM quote_creation_requests WHERE request_key = ${requestKey})`
  const statements: unknown[] = [db.insert(schema.quoteCreationRequests).values({
    requestKey,
    userId: input.userId,
    payloadHash: input.payloadHash,
    authorId: input.authorId,
    referenceId: input.referenceId,
  }), db.insert(schema.quoteNameClaims).values({
    normalizedName: sql`lower(trim(${input.quote.name}))`,
  })]

  if (input.newAuthor) {
    const authorInput = Object.fromEntries(
      Object.entries(input.newAuthor).filter(([, value]) => value !== undefined),
    )
    statements.push(db.insert(schema.authors).values({
      name: input.newAuthor.name,
      isFictional: input.newAuthor.isFictional ?? false,
      job: input.newAuthor.job ?? null,
      description: input.newAuthor.description ?? null,
      ...authorLifeDateColumnsFromInput('birth', authorInput),
      birthLocation: input.newAuthor.birth_location ?? null,
      ...authorLifeDateColumnsFromInput('death', authorInput),
      deathLocation: input.newAuthor.death_location ?? null,
      imageUrl: input.newAuthor.image_url ?? null,
    }))
    statements.push(db.update(schema.quoteCreationRequests)
      .set({ authorId: sql`last_insert_rowid()` })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  }

  if (input.newReference) {
    statements.push(db.insert(schema.quoteReferences).values({
      name: input.newReference.name,
      originalLanguage: input.newReference.originalLanguage ?? 'en',
      primaryType: input.newReference.primaryType as any,
      description: input.newReference.description ?? null,
      releaseDate: input.newReference.releaseDate ?? null,
    }))
    statements.push(db.update(schema.quoteCreationRequests)
      .set({ referenceId: sql`last_insert_rowid()` })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  }

  statements.push(db.insert(schema.quotes).values({
    name: input.quote.name,
    language: input.quote.language as any,
    userId: input.userId,
    status: input.quote.status ?? 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  statements.push(db.update(schema.quoteCreationRequests)
    .set({ quoteId: sql`last_insert_rowid()` })
    .where(eq(schema.quoteCreationRequests.requestKey, requestKey))
    .returning({ quoteId: schema.quoteCreationRequests.quoteId }))
  const quoteIdResultIndex = statements.length - 1

  statements.push(db.insert(schema.quoteAttributions).values({
    quoteId: field('quote_id'),
    authorId: field('author_id'),
    referenceId: field('reference_id'),
    isPrimary: true,
    status: input.primaryAttribution.status,
    notes: input.primaryAttribution.notes ?? null,
    verifiedBy: input.primaryAttribution.verifiedBy ?? null,
    verifiedAt: input.primaryAttribution.verifiedBy ? new Date() : null,
    createdBy: input.userId,
  }))
  statements.push(db.update(schema.quoteCreationRequests)
    .set({ primaryAttributionId: sql`last_insert_rowid()` })
    .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))

  for (const attribution of input.additionalAttributions ?? []) {
    statements.push(db.insert(schema.quoteAttributions).values({
      quoteId: field('quote_id'),
      authorId: attribution.authorId,
      referenceId: attribution.referenceId,
      isPrimary: false,
      status: attribution.status,
      notes: attribution.notes ?? null,
      createdBy: input.userId,
    }))
  }

  for (const source of input.sources ?? []) {
    statements.push(db.insert(schema.quoteSources).values({
      quoteId: field('quote_id'),
      attributionId: field('primary_attribution_id'),
      occurrenceId: null,
      sourceType: source.source_type ?? 'manual',
      sourceMedium: source.source_medium ?? null,
      sourceUrl: source.source_url ?? null,
      label: source.label ?? null,
      locatorType: source.locator_type ?? null,
      locatorValue: source.locator_value ?? null,
      translatorName: source.translator_name ?? null,
      verificationStatus: 'unverified',
      notes: source.notes ?? null,
      isPrimary: input.sourcesArePrimary ?? false,
      createdBy: input.userId,
    }))
  }

  for (const tagId of input.tagIds ?? []) {
    statements.push(db.insert(schema.quoteTags).values({ quoteId: field('quote_id'), tagId }))
  }

  if (input.activitySource) {
    statements.push(db.insert(schema.activityLogs).values({
      type: 'quote_created',
      userId: input.userId,
      targetId: field('quote_id'),
      targetType: 'quote',
      metadata: JSON.stringify({ status: input.quote.status ?? 'draft', name: input.quote.name }),
      source: input.activitySource,
    }))
  }

  if (input.retainIdempotencyRecord === false) {
    statements.push(db.delete(schema.quoteCreationRequests)
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  } else {
    // Keep only the idempotency result after the transaction commits.
    statements.push(db.update(schema.quoteCreationRequests)
      .set({ authorId: null, referenceId: null, primaryAttributionId: null })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  }

  return { statements, quoteIdResultIndex }
}
