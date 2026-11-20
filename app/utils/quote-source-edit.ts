import type { CreateQuoteSourceData, QuoteProvenanceStatus } from '~~/shared/types/quote'

export type EditableQuoteSource = CreateQuoteSourceData & {
  id?: number
  attribution_id?: number | null
  occurrence_id?: number | null
  verification_status?: QuoteProvenanceStatus
  verified_by?: number | null
  verified_at?: string | null
  is_primary?: boolean
}

export type QuoteSourceEditPayload = {
  id?: number
  attribution_id: number | null
  occurrence_id: number | null
  source_type: string
  source_medium: CreateQuoteSourceData['source_medium']
  source_url: string | null
  label: string | null
  locator_type: CreateQuoteSourceData['locator_type']
  locator_value: string | null
  translator_name: string | null
  notes: string | null
  is_primary: boolean
  verification_status?: QuoteProvenanceStatus
}

export type QuoteSourceSnapshotPayload = Required<Pick<QuoteSourceEditPayload,
  'id' | 'attribution_id' | 'occurrence_id' | 'source_type' | 'source_medium' | 'source_url' | 'label'
  | 'locator_type' | 'locator_value' | 'translator_name' | 'notes' | 'is_primary'>> & {
  verification_status: QuoteProvenanceStatus
  verified_by: number | null
  verified_at: string | null
}

export const isPersistedQuoteSource = (sourceId: number | undefined, currentSourceIds: ReadonlySet<number>) =>
  sourceId !== undefined && currentSourceIds.has(sourceId)

export const resolveQuoteSourceAttributionId = (
  sourceAttributionId: number | null | undefined,
  currentAttributionIds: ReadonlySet<number>,
  primaryAttributionId: number,
) => sourceAttributionId != null && currentAttributionIds.has(sourceAttributionId)
  ? sourceAttributionId
  : primaryAttributionId

export const hasQuoteSourceContent = (source: EditableQuoteSource) => Boolean(
  source.id
  || source.source_type?.trim()
  || source.source_url?.trim()
  || source.label?.trim()
  || source.source_medium
  || source.locator_type
  || source.locator_value?.trim()
  || source.translator_name?.trim()
  || source.notes?.trim(),
)

export const getExplicitQuoteSourceDeleteIds = (
  initialSnapshotIds: readonly number[],
  retainedIds: ReadonlySet<number>,
) => [...new Set(initialSnapshotIds)].filter(id => !retainedIds.has(id))

export const isQuoteSourceLoadCurrent = (requestToken: number, activeToken: number, requestQuoteId: number, activeQuoteId: number | undefined, isOpen: boolean) =>
  requestToken === activeToken && requestQuoteId === activeQuoteId && isOpen

export const buildQuoteSourceEditPayload = (
  sources: readonly EditableQuoteSource[],
  initialSnapshotIds: readonly number[],
  initialSnapshot: readonly EditableQuoteSource[],
  currentAttributionIds: ReadonlySet<number>,
  primaryAttributionId: number,
) => {
  const snapshot = new Set(initialSnapshotIds)
  const snapshotPayload: QuoteSourceSnapshotPayload[] = initialSnapshot.map(source => ({
    id: source.id!,
    attribution_id: source.attribution_id ?? null,
    occurrence_id: source.occurrence_id ?? null,
    source_type: source.source_type ?? 'manual',
    source_medium: source.source_medium ?? null,
    source_url: source.source_url ?? null,
    label: source.label ?? null,
    locator_type: source.locator_type ?? null,
    locator_value: source.locator_value ?? null,
    translator_name: source.translator_name ?? null,
    verification_status: source.verification_status ?? 'unverified',
    verified_by: source.verified_by ?? null,
    verified_at: source.verified_at ?? null,
    notes: source.notes ?? null,
    is_primary: Boolean(source.is_primary),
  }))
  const retained = sources.filter(hasQuoteSourceContent)
  const hasPrimary = retained.some(source => source.is_primary)
  const shouldChooseFallbackPrimary = initialSnapshot.some(source => source.is_primary) && !hasPrimary && retained.length > 0
  const initialById = new Map(initialSnapshot.map(source => [source.id, source]))
  const normalizedText = (value: string | null | undefined) => value?.trim() || null
  const data: QuoteSourceEditPayload[] = retained.map((source, index) => {
    const id = source.id != null && snapshot.has(source.id) ? source.id : undefined
    const initial = id === undefined ? undefined : initialById.get(id)
    const textValue = (value: string | null | undefined, original: string | null | undefined) =>
      initial && value === original ? original ?? null : normalizedText(value)
    return {
      ...(id !== undefined ? { id } : { verification_status: 'unverified' as const }),
      attribution_id: id !== undefined
        ? source.attribution_id ?? null
        : resolveQuoteSourceAttributionId(source.attribution_id, currentAttributionIds, primaryAttributionId),
      occurrence_id: source.occurrence_id ?? null,
      source_type: initial && source.source_type === initial.source_type
        ? initial.source_type ?? 'manual'
        : source.source_type?.trim() || 'manual',
      source_medium: source.source_medium ?? null,
      source_url: textValue(source.source_url, initial?.source_url),
      label: textValue(source.label, initial?.label),
      locator_type: source.locator_type ?? null,
      locator_value: textValue(source.locator_value, initial?.locator_value),
      translator_name: textValue(source.translator_name, initial?.translator_name),
      notes: textValue(source.notes, initial?.notes),
      is_primary: Boolean(source.is_primary) || (shouldChooseFallbackPrimary && index === 0),
    }
  })
  const retainedIds = new Set(data.flatMap(source => source.id === undefined ? [] : [source.id]))

  return {
    sources: data,
    source_snapshot_ids: [...snapshot],
    source_snapshot: snapshotPayload,
    delete_source_ids: getExplicitQuoteSourceDeleteIds([...snapshot], retainedIds),
  }
}
