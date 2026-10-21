export type AuthorLifeDateEra = 'bce' | 'ce'

/** A historical life date. Missing month/day means the source only gives a year or month. */
export interface AuthorLifeDate {
  year: number
  era: AuthorLifeDateEra
  month?: number | null
  day?: number | null
  approximate?: boolean
  calendar?: string
}
