import type { AuthorLifeDate, AuthorLifeDateEra } from '../types/author-life-date'

const DEFAULT_CALENDAR = 'gregorian-proleptic'

export function authorLifeDateFromFields(fields: {
  year?: number | null
  era?: AuthorLifeDateEra
  month?: number | null
  day?: number | null
  approximate?: boolean
  calendar?: string
  legacy?: string | null
}): AuthorLifeDate | null {
  if (typeof fields.year === 'number') {
    return authorLifeDateFromParts(fields.year, fields.era ?? 'ce', fields.month ?? null, fields.day ?? null, fields.approximate ?? false, fields.calendar ?? DEFAULT_CALENDAR)
  }
  return parseAuthorLifeDate(fields.legacy)
}

export function parseAuthorLifeDate(value?: string | null): AuthorLifeDate | null {
  if (!value) return null
  const match = value.match(/^(\d{1,6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T.*)?$/)
  if (!match) return null

  const year = Number(match[1])
  if (year < 1) return null
  const month = match[2] ? Number(match[2]) : undefined
  const day = match[3] ? Number(match[3]) : undefined
  if (month !== undefined && (month < 1 || month > 12)) return null
  if (day !== undefined && (month === undefined || day < 1 || day > daysInMonth(year, month))) return null

  return { year, era: 'ce', month, day, approximate: false, calendar: DEFAULT_CALENDAR }
}

export function serializeAuthorLifeDate(date?: AuthorLifeDate | null): string | null {
  if (!date) return null
  if (date.era === 'bce') return null
  const year = String(date.year).padStart(4, '0')
  if (!date.month) return year
  const month = String(date.month).padStart(2, '0')
  if (!date.day) return `${year}-${month}`
  return `${year}-${month}-${String(date.day).padStart(2, '0')}`
}

export function formatAuthorLifeDate(date?: AuthorLifeDate | null, locale = 'en'): string {
  if (!date) return ''
  const era = date.era === 'bce' ? (locale.startsWith('fr') ? ' av. J.-C.' : ' BCE') : ''
  const approximate = date.approximate ? (locale.startsWith('fr') ? 'vers ' : 'c. ') : ''
  const formatted = [date.day, date.month, date.year]
    .filter(value => value !== undefined && value !== null)
    .map((value, index) => index === 2 ? String(value) : String(value).padStart(2, '0'))
    .join('/')
  return `${approximate}${formatted}${era}`
}

export function formatAuthorLifeSpan(
  birth?: AuthorLifeDate | null,
  death?: AuthorLifeDate | null,
  locale = 'en',
): string {
  if (!birth && !death) return ''
  const present = locale.startsWith('fr') ? 'aujourd’hui' : 'present'
  if (birth && death && birth.era === death.era && birth.approximate === death.approximate) {
    const era = birth.era === 'bce' ? (locale.startsWith('fr') ? ' av. J.-C.' : ' BCE') : ''
    const birthLabel = formatAuthorLifeDate(birth, locale).replace(era, '')
    const deathLabel = formatAuthorLifeDate(death, locale).replace(era, '')
    return `${birthLabel} – ${deathLabel}${era}`
  }
  return `${birth ? formatAuthorLifeDate(birth, locale) : '?'} – ${death ? formatAuthorLifeDate(death, locale) : present}`
}

export function authorLifeDateFromParts(
  year: number | null,
  era: AuthorLifeDateEra,
  month: number | null,
  day: number | null,
  approximate = false,
  calendar = DEFAULT_CALENDAR,
): AuthorLifeDate | null {
  if (year === null || !Number.isInteger(year) || year < 1 || year > 999999) return null
  if (month !== null && (month < 1 || month > 12)) return null
  if (day !== null && (month === null || day < 1 || day > daysInMonth(year, month))) return null
  return {
    year,
    era,
    month: month || undefined,
    day: day || undefined,
    approximate,
    calendar,
  }
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export function authorLifeDateSortYear(date: AuthorLifeDate): number {
  return date.era === 'bce' ? -date.year : date.year
}
