export const isPersistedQuoteSource = (sourceId: number | undefined, currentSourceIds: ReadonlySet<number>) =>
  sourceId !== undefined && currentSourceIds.has(sourceId)

export const resolveQuoteSourceAttributionId = (
  sourceAttributionId: number | null | undefined,
  currentAttributionIds: ReadonlySet<number>,
  primaryAttributionId: number,
) => sourceAttributionId != null && currentAttributionIds.has(sourceAttributionId)
  ? sourceAttributionId
  : primaryAttributionId
