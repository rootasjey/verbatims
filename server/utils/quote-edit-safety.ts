type PrimaryAttributionSnapshot = {
  authorId: number | null
  referenceId: number | null
  status: 'unverified' | 'manually_verified' | 'externally_verified' | 'disputed'
}

type SubmittedAttribution = {
  status?: PrimaryAttributionSnapshot['status']
  notes?: string | null
}

type ProvenanceStatus = PrimaryAttributionSnapshot['status']

export const buildProvenanceStatusFields = (
  currentStatus: ProvenanceStatus | undefined,
  requestedStatus: ProvenanceStatus | undefined,
  canSetStatus: boolean,
  actorId: number,
  identityChanged = false,
) => {
  if (!canSetStatus || requestedStatus === undefined) {
    return identityChanged
      ? { status: 'unverified' as const, verifiedBy: null, verifiedAt: null }
      : {}
  }
  if (!identityChanged && requestedStatus === currentStatus) return {}
  return {
    status: requestedStatus,
    verifiedBy: requestedStatus === 'unverified' ? null : actorId,
    verifiedAt: requestedStatus === 'unverified' ? null : new Date(),
  }
}

export const shouldUpdateOnlyPrimaryAttribution = (submittedCount: number | undefined, primaryExists: boolean) =>
  submittedCount === 1 && primaryExists

export const buildPrimaryAttributionUpdate = (
  current: PrimaryAttributionSnapshot,
  submitted: SubmittedAttribution,
  authorId: number | null | SQL<number | null>,
  referenceId: number | null | SQL<number | null>,
  actorId: number,
  canSetStatus = true,
) => {
  const identityChanged = current.authorId !== authorId || current.referenceId !== referenceId
  return {
    authorId,
    referenceId,
    ...buildProvenanceStatusFields(current.status, submitted.status, canSetStatus, actorId, identityChanged),
    ...(submitted.notes !== undefined ? { notes: submitted.notes } : {}),
    updatedAt: new Date(),
  }
}

export const getQuoteSourceSnapshotDeleteIds = (snapshotIds: readonly number[], retainedIds: ReadonlySet<number>) =>
  [...new Set(snapshotIds)].filter(id => !retainedIds.has(id))

export const orderQuoteSourceMutations = <T>(demotions: readonly T[], deletions: readonly T[], promotions: readonly T[]) =>
  [...demotions, ...deletions, ...promotions]

export const isQuoteSourceSnapshotConflictError = (error: unknown) =>
  /quote_editorial_audit_context\.source|quote_sources\.source_type|idx_quote_sources_one_primary|quote_sources\.quote_id/i.test(error instanceof Error ? error.message : String(error))
import type { SQL } from 'drizzle-orm'

type QuoteSourceSnapshot = {
  attribution_id: number | null
  occurrence_id: number | null
  source_type: string
  source_medium: string | null
  source_url: string | null
  label: string | null
  locator_type: string | null
  locator_value: string | null
  translator_name: string | null
  verification_status: PrimaryAttributionSnapshot['status']
  verified_by: number | null
  verified_at: string | null
  notes: string | null
  is_primary: boolean
}

type QuoteSourceRow = {
  attributionId: number | null
  occurrenceId: number | null
  sourceType: string
  sourceMedium: string | null
  sourceUrl: string | null
  label: string | null
  locatorType: string | null
  locatorValue: string | null
  translatorName: string | null
  verificationStatus: QuoteSourceSnapshot['verification_status']
  verifiedBy: number | null
  verifiedAt: Date | string | null
  notes: string | null
  isPrimary: boolean
}

const normalize = (value: string | null | undefined) => value ?? null
const timestamp = (value: Date | string | null | undefined) => value == null ? null : value instanceof Date ? value.toISOString() : new Date(value).toISOString()

export const quoteSourceMatchesSnapshot = (current: QuoteSourceRow, snapshot: QuoteSourceSnapshot) =>
  current.attributionId === snapshot.attribution_id
  && current.occurrenceId === snapshot.occurrence_id
  && current.sourceType === snapshot.source_type
  && normalize(current.sourceMedium) === normalize(snapshot.source_medium)
  && normalize(current.sourceUrl) === normalize(snapshot.source_url)
  && normalize(current.label) === normalize(snapshot.label)
  && normalize(current.locatorType) === normalize(snapshot.locator_type)
  && normalize(current.locatorValue) === normalize(snapshot.locator_value)
  && normalize(current.translatorName) === normalize(snapshot.translator_name)
  && current.verificationStatus === snapshot.verification_status
  && current.verifiedBy === snapshot.verified_by
  && timestamp(current.verifiedAt) === timestamp(snapshot.verified_at)
  && normalize(current.notes) === normalize(snapshot.notes)
  && current.isPrimary === snapshot.is_primary

export const quoteSourceProofChanged = (current: QuoteSourceRow, edited: QuoteSourceSnapshot) =>
  current.sourceType !== edited.source_type
  || normalize(current.sourceMedium) !== normalize(edited.source_medium)
  || normalize(current.sourceUrl) !== normalize(edited.source_url)
  || normalize(current.label) !== normalize(edited.label)
  || normalize(current.locatorType) !== normalize(edited.locator_type)
  || normalize(current.locatorValue) !== normalize(edited.locator_value)
  || normalize(current.translatorName) !== normalize(edited.translator_name)

export const quoteSourceMatchesEdit = (current: QuoteSourceRow, edited: QuoteSourceSnapshot) =>
  current.attributionId === edited.attribution_id
  && current.occurrenceId === edited.occurrence_id
  && current.sourceType === edited.source_type
  && normalize(current.sourceMedium) === normalize(edited.source_medium)
  && normalize(current.sourceUrl) === normalize(edited.source_url)
  && normalize(current.label) === normalize(edited.label)
  && normalize(current.locatorType) === normalize(edited.locator_type)
  && normalize(current.locatorValue) === normalize(edited.locator_value)
  && normalize(current.translatorName) === normalize(edited.translator_name)
  && normalize(current.notes) === normalize(edited.notes)
  && current.isPrimary === edited.is_primary
