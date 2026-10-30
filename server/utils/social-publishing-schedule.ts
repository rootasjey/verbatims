const THEME_POST_HOUR = 16
const THEME_POST_MINUTE = 8
const SOCIAL_MEDIA_PREP_INTERVAL_MS = 3 * 60 * 60 * 1000

/** True when a theme's upcoming post slot arrives before the next 3-hour media-prep cron. */
export function themeMediaNeedsImmediatePreparation(scheduledFor: Date | null, now = new Date()) {
  if (!scheduledFor) return false

  const nextPostAt = getNextParisThemePostAt(now)
  if (scheduledFor.getTime() > nextPostAt.getTime()) return false

  const nextPreparationAt = (Math.floor(now.getTime() / SOCIAL_MEDIA_PREP_INTERVAL_MS) + 1) * SOCIAL_MEDIA_PREP_INTERVAL_MS
  return nextPreparationAt > nextPostAt.getTime()
}

function getNextParisThemePostAt(now: Date) {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now)
  const parts = Object.fromEntries(dateParts.map(part => [part.type, part.value]))
  let year = Number(parts.year)
  let month = Number(parts.month)
  let day = Number(parts.day)
  let candidate = parisLocalTimeToUtc(year, month, day, THEME_POST_HOUR, THEME_POST_MINUTE)

  if (candidate <= now) {
    const nextLocalDate = new Date(Date.UTC(year, month - 1, day + 1))
    year = nextLocalDate.getUTCFullYear()
    month = nextLocalDate.getUTCMonth() + 1
    day = nextLocalDate.getUTCDate()
    candidate = parisLocalTimeToUtc(year, month, day, THEME_POST_HOUR, THEME_POST_MINUTE)
  }

  return candidate
}

function parisLocalTimeToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  const localTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  let candidate = new Date(localTimeAsUtc)
  for (let attempt = 0; attempt < 2; attempt++) {
    const timeZoneName = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Paris',
      timeZoneName: 'shortOffset'
    }).formatToParts(candidate).find(part => part.type === 'timeZoneName')?.value || 'GMT+1'
    const offsetMatch = timeZoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    const offsetMinutes = offsetMatch
      ? (offsetMatch[1] === '-' ? -1 : 1) * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] || 0))
      : 60
    candidate = new Date(localTimeAsUtc - offsetMinutes * 60_000)
  }
  return candidate
}
