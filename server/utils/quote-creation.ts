import { db, schema } from 'hub:db'
import { and, eq, sql } from 'drizzle-orm'
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

function buildImportedAuthorStatements(requestKey: string, author: InlineAuthor) {
  const authorInput = Object.fromEntries(
    Object.entries(author).filter(([, value]) => value !== undefined),
  )
  const birth = authorLifeDateColumnsFromInput('birth', authorInput)
  const death = authorLifeDateColumnsFromInput('death', authorInput)
  return [
    db.run(sql`INSERT INTO authors (
      name, is_fictional, job, description,
      birth_date, birth_year, birth_era, birth_month, birth_day, birth_is_approximate, birth_calendar, birth_location,
      death_date, death_year, death_era, death_month, death_day, death_is_approximate, death_calendar, death_location,
      image_url
    ) SELECT
      ${author.name}, ${author.isFictional ?? false}, ${author.job ?? null}, ${author.description ?? null},
      ${birth.birthDate ?? null}, ${birth.birthYear ?? null}, ${birth.birthEra ?? 'ce'}, ${birth.birthMonth ?? null}, ${birth.birthDay ?? null}, ${birth.birthIsApproximate ?? false}, ${birth.birthCalendar ?? 'gregorian-proleptic'}, ${author.birth_location ?? null},
      ${death.deathDate ?? null}, ${death.deathYear ?? null}, ${death.deathEra ?? 'ce'}, ${death.deathMonth ?? null}, ${death.deathDay ?? null}, ${death.deathIsApproximate ?? false}, ${death.deathCalendar ?? 'gregorian-proleptic'}, ${author.death_location ?? null},
      ${author.image_url ?? null}
    FROM quote_creation_requests
    WHERE request_key = ${requestKey}
      AND NOT EXISTS (SELECT 1 FROM authors WHERE LOWER(name) = LOWER(${author.name}))`),
    db.update(schema.quoteCreationRequests)
      .set({ authorId: sql`(
        SELECT id FROM authors WHERE LOWER(name) = LOWER(${author.name}) ORDER BY id LIMIT 1
      )` })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)),
  ]
}

function buildImportedReferenceStatements(requestKey: string, reference: InlineReference) {
  return [
    db.run(sql`INSERT INTO quote_references (name, original_language, primary_type, description, release_date)
      SELECT ${reference.name}, ${reference.originalLanguage ?? 'en'}, ${reference.primaryType}, ${reference.description ?? null}, ${reference.releaseDate ?? null}
      FROM quote_creation_requests
      WHERE request_key = ${requestKey}
        AND NOT EXISTS (SELECT 1 FROM quote_references WHERE LOWER(name) = LOWER(${reference.name}))`),
    db.update(schema.quoteCreationRequests)
      .set({ referenceId: sql`(
        SELECT id FROM quote_references WHERE LOWER(name) = LOWER(${reference.name}) ORDER BY id LIMIT 1
      )` })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)),
  ]
}

export type QuoteCreationBatchInput = {
  requestKey: string
  userId: number
  payloadHash: string
  quote: {
    name: string
    language: string
    status?: 'harvested' | 'draft' | 'pending' | 'approved' | 'rejected'
    id?: number
    moderatorId?: number | null
    moderatedAt?: Date | null
    rejectionReason?: string | null
    viewsCount?: number
    likesCount?: number
    sharesCount?: number
    isFeatured?: boolean
    createdAt?: Date
    updatedAt?: Date
  }
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
  claimName?: boolean
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
  })]

  if (input.claimName !== false && input.quote.status !== 'rejected') {
    statements.push(db.insert(schema.quoteNameClaims).values({
      normalizedName: sql`lower(trim(${input.quote.name}))`,
    }))
  }

  if (input.newAuthor) {
    statements.push(...buildImportedAuthorStatements(requestKey, input.newAuthor))
  }

  if (input.newReference) {
    statements.push(...buildImportedReferenceStatements(requestKey, input.newReference))
  }

  statements.push(db.insert(schema.quotes).values({
    id: input.quote.id,
    name: input.quote.name,
    language: input.quote.language as any,
    userId: input.userId,
    status: input.quote.status ?? 'draft',
    moderatorId: input.quote.moderatorId ?? null,
    moderatedAt: input.quote.moderatedAt ?? null,
    rejectionReason: input.quote.rejectionReason ?? null,
    viewsCount: input.quote.viewsCount ?? 0,
    likesCount: input.quote.likesCount ?? 0,
    sharesCount: input.quote.sharesCount ?? 0,
    isFeatured: input.quote.isFeatured ?? false,
    createdAt: input.quote.createdAt ?? new Date(),
    updatedAt: input.quote.updatedAt ?? new Date(),
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

export type QuoteImportUpsertBatchInput = {
  requestKey: string
  userId: number
  payloadHash: string
  quoteId: number
  updateData: Record<string, unknown>
  authorId: number | null
  referenceId: number | null
  newAuthor?: InlineAuthor
  newReference?: InlineReference
  existingAttributionId?: number
  attributionIsPrimary: boolean
  skipAttribution?: boolean
  source?: CreateQuoteSourceData
  retainIdempotencyRecord?: boolean
}

export function buildQuoteImportUpsertStatements(input: QuoteImportUpsertBatchInput) {
  const { requestKey } = input
  const field = (column: 'author_id' | 'reference_id' | 'quote_id' | 'primary_attribution_id') =>
    sql`(SELECT ${sql.raw(column)} FROM quote_creation_requests WHERE request_key = ${requestKey})`
  const statements: unknown[] = [db.insert(schema.quoteCreationRequests).values({
    requestKey,
    userId: input.userId,
    payloadHash: input.payloadHash,
    quoteId: input.quoteId,
    authorId: input.authorId,
    referenceId: input.referenceId,
    primaryAttributionId: input.existingAttributionId ?? null,
  })]

  if (input.newAuthor) {
    statements.push(...buildImportedAuthorStatements(requestKey, input.newAuthor))
  }

  if (input.newReference) {
    statements.push(...buildImportedReferenceStatements(requestKey, input.newReference))
  }

  if (Object.keys(input.updateData).length > 0) {
    statements.push(db.update(schema.quotes)
      .set(input.updateData as any)
      .where(eq(schema.quotes.id, input.quoteId)))
  }

  if (input.existingAttributionId != null && input.attributionIsPrimary) {
    statements.push(db.update(schema.quoteAttributions)
      .set({ isPrimary: true })
      .where(eq(schema.quoteAttributions.id, input.existingAttributionId)))
  } else if (input.existingAttributionId == null && !input.skipAttribution) {
    statements.push(db.run(sql`INSERT INTO quote_attributions (quote_id, author_id, reference_id, is_primary, status, created_by)
      SELECT quote_id, author_id, reference_id, ${input.attributionIsPrimary}, 'unverified', ${input.userId}
      FROM quote_creation_requests
      WHERE request_key = ${requestKey}
        AND NOT EXISTS (
          SELECT 1 FROM quote_attributions
          WHERE quote_id = ${field('quote_id')}
            AND author_id IS ${field('author_id')}
            AND reference_id IS ${field('reference_id')}
        )`))
    statements.push(db.update(schema.quoteCreationRequests)
      .set({ primaryAttributionId: sql`(
        SELECT id FROM quote_attributions
        WHERE quote_id = ${field('quote_id')}
          AND author_id IS ${field('author_id')}
          AND reference_id IS ${field('reference_id')}
        ORDER BY id
        LIMIT 1
      )` })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  }

  if (input.source) {
    const sourceType = input.source.source_type ?? 'manual'
    const sourceUrl = input.source.source_url ?? null
    statements.push(db.run(sql`INSERT INTO quote_sources (
      quote_id, attribution_id, occurrence_id, source_type, source_medium, source_url,
      label, locator_type, locator_value, translator_name, verification_status, notes, is_primary, created_by
    ) SELECT
      quote_id, primary_attribution_id, NULL, ${sourceType}, NULL, ${sourceUrl},
      NULL, NULL, NULL, NULL, 'unverified', NULL, false, ${input.userId}
    FROM quote_creation_requests
    WHERE request_key = ${requestKey}
      AND NOT EXISTS (
        SELECT 1 FROM quote_sources
        WHERE quote_id = ${field('quote_id')}
          AND attribution_id IS ${field('primary_attribution_id')}
          AND source_type = ${sourceType}
          AND source_url IS ${sourceUrl}
      )`))
  }

  if (input.retainIdempotencyRecord === false) {
    statements.push(db.delete(schema.quoteCreationRequests)
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  } else {
    statements.push(db.update(schema.quoteCreationRequests)
      .set({ authorId: null, referenceId: null, primaryAttributionId: null })
      .where(eq(schema.quoteCreationRequests.requestKey, requestKey)))
  }

  return statements
}
