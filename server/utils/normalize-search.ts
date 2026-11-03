import { sql } from 'drizzle-orm'
import type { SQL, Column } from 'drizzle-orm'

export interface NormalizedSearch {
  words: string[]
  likePattern: string
  foldedLikePattern: string
  hasContent: boolean
  toMatchQuery(): string
}

// Keep this map aligned with foldAccents. SQL replacements are emitted in
// small subquery groups below so SQLite's parser does not overflow on nested
// search predicates.
const ACCENT_MAP: ReadonlyArray<readonly [string, string]> = [
  ['é', 'e'], ['É', 'e'], ['è', 'e'], ['È', 'e'], ['ê', 'e'], ['Ê', 'e'],
  ['à', 'a'], ['À', 'a'], ['â', 'a'], ['Â', 'a'],
  ['ç', 'c'], ['Ç', 'c'],
  ['î', 'i'], ['Î', 'i'], ['ï', 'i'], ['Ï', 'i'],
  ['ô', 'o'], ['Ô', 'o'], ['ö', 'o'], ['Ö', 'o'],
  ['ù', 'u'], ['Ù', 'u'], ['ü', 'u'], ['Ü', 'u'],
  ['ñ', 'n'], ['Ñ', 'n'], ['á', 'a'], ['Á', 'a'],
]

export function foldAccents(input: string): string {
  let out = input
  for (const [from, to] of ACCENT_MAP) {
    out = out.split(from).join(to)
  }
  return out
}

export function foldAccentsSQL(column: SQL | Column): SQL {
  let expr: SQL = sql`${column}`
  const replacementsPerGroup = 7

  for (let offset = 0; offset < ACCENT_MAP.length; offset += replacementsPerGroup) {
    let value: SQL = sql`value`
    for (const [from, to] of ACCENT_MAP.slice(offset, offset + replacementsPerGroup)) {
      value = sql`REPLACE(${value}, ${from}, ${to})`
    }
    expr = sql`(SELECT ${value} FROM (SELECT ${expr} AS value))`
  }

  return expr
}

export function normalizeSearch(input: string | undefined | null, minLength = 2): NormalizedSearch {
  const fallback: NormalizedSearch = {
    words: [],
    likePattern: '',
    foldedLikePattern: '',
    hasContent: false,
    toMatchQuery: () => '',
  }

  if (!input) return fallback

  const trimmed = input.trim()
  if (trimmed.length < minLength) return fallback

  const words = trimmed
    .replace(/[.,!?;:()"\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return fallback

  const escaped = (w: string) => {
    const s = w.replace(/"/g, '')
    if (/^(AND|OR|NOT|NEAR)$/i.test(s)) return `"${s}"`
    return s
  }

  return {
    words,
    likePattern: `%${words.join('%')}%`,
    foldedLikePattern: `%${words.map(foldAccents).join('%')}%`,
    hasContent: true,
    toMatchQuery() {
      return words.map(w => `"${escaped(w)}"`).join(' AND ')
    },
  }
}
