/** Formats the supported year, date, and year-range values used for references. */
export function formatReferenceReleaseDate(value: string | number | null | undefined): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= 9999 ? String(value) : ''
  }

  const date = value?.trim()
  if (!date) return ''

  const fullDateMatch = date.match(/^(\d{4})-\d{2}-\d{2}(?:T.*)?$/)
  const fullDateYear = fullDateMatch?.[1]
  if (fullDateYear) return fullDateYear

  const yearOrRangeMatch = date.match(/^(\d{1,4})(?:\s*[-–—]\s*(\d{1,4}))?$/)
  const startYear = yearOrRangeMatch?.[1]
  if (!startYear) return ''

  const endYear = yearOrRangeMatch?.[2]
  return endYear ? `${startYear}–${endYear}` : startYear
}
