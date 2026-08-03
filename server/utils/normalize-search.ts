export interface NormalizedSearch {
  words: string[]
  likePattern: string
  hasContent: boolean
  toMatchQuery(): string
}

export function normalizeSearch(input: string | undefined | null, minLength = 2): NormalizedSearch {
  const fallback: NormalizedSearch = {
    words: [],
    likePattern: '',
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
    hasContent: true,
    toMatchQuery() {
      return words.map(w => `"${escaped(w)}"`).join(' AND ')
    },
  }
}
