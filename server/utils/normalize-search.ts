import { sql } from 'drizzle-orm'
import type { SQL, Column } from 'drizzle-orm'

export interface NormalizedSearch {
  words: string[]
  likePattern: string
  foldedLikePattern: string
  hasContent: boolean
  toMatchQuery(): string
}

// The SQL folding chain is limited by SQLite's parser stack (~28 nested calls
// including LOWER). This map is sized to fit that limit while covering the
// most common accents in the supported languages (French, Spanish, Italian,
// Portuguese, German). Both the JS term folding and the SQL column folding
// MUST use the same map.
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
  for (const [from, to] of ACCENT_MAP) {
    expr = sql`REPLACE(${expr}, ${from}, ${to})`
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
