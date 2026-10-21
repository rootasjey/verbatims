import type { AuthorLifeDate } from '#shared/types/author-life-date'
import { authorLifeDateFromParts, parseAuthorLifeDate, serializeAuthorLifeDate } from '#shared/utils/author-life-date'

type DatePrefix = 'birth' | 'death'
export interface AuthorLifeDateColumns {
  birthDate?: string | null
  birthYear?: number | null
  birthEra?: 'bce' | 'ce'
  birthMonth?: number | null
  birthDay?: number | null
  birthIsApproximate?: boolean
  birthCalendar?: string
  deathDate?: string | null
  deathYear?: number | null
  deathEra?: 'bce' | 'ce'
  deathMonth?: number | null
  deathDay?: number | null
  deathIsApproximate?: boolean
  deathCalendar?: string
}

export function authorLifeDateFromRow(row: Record<string, unknown>, prefix: DatePrefix): AuthorLifeDate | null {
  const year = row[`${prefix}Year`]
  if (typeof year === 'number') {
    return authorLifeDateFromParts(
      year,
      row[`${prefix}Era`] === 'bce' ? 'bce' : 'ce',
      typeof row[`${prefix}Month`] === 'number' ? row[`${prefix}Month`] as number : null,
      typeof row[`${prefix}Day`] === 'number' ? row[`${prefix}Day`] as number : null,
      Boolean(row[`${prefix}IsApproximate`]),
      typeof row[`${prefix}Calendar`] === 'string' ? row[`${prefix}Calendar`] as string : 'gregorian-proleptic',
    )
  }

  const legacy = row[prefix === 'birth' ? 'birthDate' : 'deathDate']
  return typeof legacy === 'string' ? parseAuthorLifeDate(legacy) : null
}

export function authorLifeDateColumnsFromInput(
  prefix: DatePrefix,
  body: Record<string, unknown>,
  existing?: Record<string, unknown>,
): AuthorLifeDateColumns {
  const dateKey = `${prefix}_date`
  const yearKey = `${prefix}_year`
  const keys = [dateKey, yearKey, `${prefix}_era`, `${prefix}_month`, `${prefix}_day`, `${prefix}_is_approximate`, `${prefix}_calendar`]
  if (!keys.some(key => Object.hasOwn(body, key))) return {}

  const current = existing ? authorLifeDateFromRow(existing, prefix) : null
  const legacyWasSent = Object.hasOwn(body, dateKey)
  const yearWasSent = Object.hasOwn(body, yearKey)
  if (legacyWasSent && body[dateKey] === null && !yearWasSent) return emptyColumns(prefix)

  const parsedLegacy = legacyWasSent && typeof body[dateKey] === 'string'
    ? parseAuthorLifeDate(body[dateKey] as string)
    : null
  const partsWereSent = keys.slice(2).some(key => Object.hasOwn(body, key))
  const date = yearWasSent
    ? authorLifeDateFromParts(
        body[yearKey] === null ? null : Number(body[yearKey]),
        body[`${prefix}_era`] === 'bce' ? 'bce' : (body[`${prefix}_era`] === 'ce' ? 'ce' : current?.era ?? 'ce'),
        Object.hasOwn(body, `${prefix}_month`) ? (body[`${prefix}_month`] === null ? null : Number(body[`${prefix}_month`])) : current?.month ?? null,
        Object.hasOwn(body, `${prefix}_day`) ? (body[`${prefix}_day`] === null ? null : Number(body[`${prefix}_day`])) : current?.day ?? null,
        Object.hasOwn(body, `${prefix}_is_approximate`) ? Boolean(body[`${prefix}_is_approximate`]) : current?.approximate ?? false,
        body[`${prefix}_calendar`] === 'gregorian-proleptic' ? 'gregorian-proleptic' : current?.calendar ?? 'gregorian-proleptic',
      )
    : parsedLegacy ?? (partsWereSent && current
        ? authorLifeDateFromParts(
            current.year,
            body[`${prefix}_era`] === 'bce' ? 'bce' : (body[`${prefix}_era`] === 'ce' ? 'ce' : current.era),
            Object.hasOwn(body, `${prefix}_month`) ? (body[`${prefix}_month`] === null ? null : Number(body[`${prefix}_month`])) : current.month ?? null,
            Object.hasOwn(body, `${prefix}_day`) ? (body[`${prefix}_day`] === null ? null : Number(body[`${prefix}_day`])) : current.day ?? null,
            Object.hasOwn(body, `${prefix}_is_approximate`) ? Boolean(body[`${prefix}_is_approximate`]) : current.approximate ?? false,
            body[`${prefix}_calendar`] === 'gregorian-proleptic' ? 'gregorian-proleptic' : current.calendar ?? 'gregorian-proleptic',
          )
        : current)

  if (!date) return emptyColumns(prefix)
  const serialized = serializeAuthorLifeDate(date)
  return {
    [`${prefix}Date`]: serialized,
    [`${prefix}Year`]: date.year,
    [`${prefix}Era`]: date.era,
    [`${prefix}Month`]: date.month ?? null,
    [`${prefix}Day`]: date.day ?? null,
    [`${prefix}IsApproximate`]: date.approximate ?? false,
    [`${prefix}Calendar`]: date.calendar ?? 'gregorian-proleptic',
  }
}

function emptyColumns(prefix: DatePrefix) {
  return {
    [`${prefix}Date`]: null,
    [`${prefix}Year`]: null,
    [`${prefix}Era`]: 'ce',
    [`${prefix}Month`]: null,
    [`${prefix}Day`]: null,
    [`${prefix}IsApproximate`]: false,
    [`${prefix}Calendar`]: 'gregorian-proleptic',
  }
}
