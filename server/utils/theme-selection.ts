export interface FilterMatchSet {
  ids: number[]
  matchMode: string
}

export function resolveFeaturedQuoteId(
  config: {
    featured_quote_id?: unknown
    featured_quote_ids?: Record<string, unknown> | null
    featured_quote_calendar?: Record<string, Record<string, unknown> | null> | null
  },
  language?: string,
  date = new Date(),
): number | undefined {
  const localDate = getParisDateKey(date)
  const scheduledId = language ? config.featured_quote_calendar?.[localDate]?.[language] : undefined
  if (isValidQuoteId(scheduledId)) return scheduledId

  const languageSpecificId = language ? config.featured_quote_ids?.[language] : undefined
  if (isValidQuoteId(languageSpecificId)) return languageSpecificId

  const defaultId = config.featured_quote_id
  return isValidQuoteId(defaultId) ? defaultId : undefined
}

/** Returns a stable calendar key for the editorial timezone, independent of the Worker timezone. */
export function getParisDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

function isValidQuoteId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function isThemeWithinSchedule(
  schedule: { scheduledStart?: Date | null; scheduledEnd?: Date | null },
  now: number,
): boolean {
  const startsAt = schedule.scheduledStart?.getTime()
  const endsAt = schedule.scheduledEnd?.getTime()

  return (startsAt === undefined || now >= startsAt) && (endsAt === undefined || now <= endsAt)
}

/** Combines filter results without allowing an `any` filter to bypass `all`. */
export function combineFilterMatchSets(matchSets: FilterMatchSet[]): number[] {
  if (matchSets.length === 0) return []

  const allSets = matchSets.filter(set => set.matchMode === 'all').map(set => new Set(set.ids))
  const anySets = matchSets.filter(set => set.matchMode !== 'all').map(set => set.ids)

  let ids: Set<number> | null = allSets.length
    ? new Set([...allSets[0]!].filter(id => allSets.every(set => set.has(id))))
    : new Set(anySets.flat())

  if (allSets.length && anySets.length) {
    const anyIds = new Set(anySets.flat())
    ids = new Set([...ids].filter(id => anyIds.has(id)))
  }

  return [...ids]
}

export function getThemeContentLanguages(
  themeLanguage: string | null | undefined,
  filters: Array<{ type: string; value: string }>,
): string[] | null {
  const explicitLanguages = filters
    .filter(filter => filter.type === 'language')
    .map(filter => filter.value)
    .filter(Boolean)

  if (explicitLanguages.length) return [...new Set(explicitLanguages)]
  if (themeLanguage) return [themeLanguage]
  return null
}
