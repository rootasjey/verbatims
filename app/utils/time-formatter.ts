export type DateInput = string | number | Date | null | undefined

function isSqlDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
}

function isNumericString(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value)
}

function normalizeEpoch(value: number): number {
  if (!Number.isFinite(value)) return Number.NaN
  const absoluteValue = Math.abs(value)
  return absoluteValue < 1e12 ? value * 1000 : value
}

export function parseDateInput(input: DateInput): Date | null {
  if (input === null || input === undefined) return null

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : new Date(input.getTime())
  }

  if (typeof input === 'number') {
    const normalizedEpoch = normalizeEpoch(input)
    const date = new Date(normalizedEpoch)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const value = String(input).trim()
  if (!value) return null

  if (isNumericString(value)) {
    const numericValue = Number(value)
    const normalizedEpoch = normalizeEpoch(numericValue)
    const date = new Date(normalizedEpoch)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const normalizedValue = isSqlDateTime(value)
    ? `${value.replace(' ', 'T')}Z`
    : value

  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function getDateTimestamp(input: DateInput): number {
  const date = parseDateInput(input)
  return date ? date.getTime() : 0
}

/**
 * Converts a date string to relative time from now.
 * If the date is older than 7 days, shows absolute date with full day name.
 * 
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: 'fr')
 * @returns Formatted time string
 */
export function formatRelativeTime(dateString: DateInput, locale: string = 'fr'): string {
  const date = parseDateInput(dateString)
  if (!date) return 'N/A'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return formatDate(date, locale)

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  // If older than 7 days, show absolute date with full day name
  if (diffDays > 7) {
    return formatDate(date, locale)
  }

  // Show relative time for recent dates
  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }

  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  }

  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
  }

  return 'Just now'
}

/**
 * Converts a date string to absolute time format.
 * Always shows the full date and time regardless of age.
 * 
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: 'fr')
 * @returns Formatted absolute time string
 */
export function formatAbsoluteTime(dateString: DateInput, locale: string = 'fr'): string {
  const date = parseDateInput(dateString)
  if (!date) return 'N/A'

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * Simple date formatting for backwards compatibility.
 * Returns just the date part in locale format.
 * 
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: 'fr')
 * @returns Formatted date string
 */
export function formatDate(dateString: DateInput, locale: string = 'fr'): string {
  const date = parseDateInput(dateString)
  if (!date) return 'N/A'
  return date.toLocaleDateString(locale)
}

/**
 * Simple date and time formatting for backwards compatibility.
 * Returns date and time in locale format.
 * 
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: 'en')
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: DateInput, locale: string = 'en'): string {
  const date = parseDateInput(dateString)
  if (!date) return 'N/A'
  return date.toLocaleString(locale)
}
