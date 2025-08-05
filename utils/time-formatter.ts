/**
 * Converts a date string to relative time from now.
 * If the date is older than 7 days, shows absolute date with full day name.
 * 
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: 'en')
 * @returns Formatted time string
 */
export function formatRelativeTime(dateString: string | null, locale: string = 'en'): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  // If older than 7 days, show absolute date with full day name
  if (diffDays > 7) {
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
 * @param locale - Locale for formatting (default: 'en')
 * @returns Formatted absolute time string
 */
export function formatAbsoluteTime(dateString: string | null, locale: string = 'en'): string {
  if (!dateString) return 'N/A'
  
  return new Date(dateString).toLocaleDateString(locale, {
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
 * @param locale - Locale for formatting (default: 'en')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | null, locale: string = 'en'): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString(locale)
}

/**
 * Simple date and time formatting for backwards compatibility.
 * Returns date and time in locale format.
 * 
 * @param dateString - ISO date string or null
 * @param locale - Locale for formatting (default: 'en')
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | null, locale: string = 'en'): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString(locale)
}
