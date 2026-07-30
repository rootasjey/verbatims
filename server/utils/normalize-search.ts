export interface NormalizedSearch {
  words: string[]
  likePattern: string
  hasContent: boolean
}

export function normalizeSearch(input: string | undefined | null, minLength = 2): NormalizedSearch {
  const fallback: NormalizedSearch = { words: [], likePattern: '', hasContent: false }

  if (!input) return fallback

  const trimmed = input.trim()
  if (trimmed.length < minLength) return fallback

  const words = trimmed
    .replace(/[.,!?;:()"\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return fallback

  return {
    words,
    likePattern: `%${words.join('%')}%`,
    hasContent: true,
  }
}
