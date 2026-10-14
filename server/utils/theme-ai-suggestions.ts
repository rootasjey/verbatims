import { z } from 'zod'

const aiSuggestionSchema = z.object({
  type: z.enum(['tag', 'author', 'reference']),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(1000),
  filters: z.array(z.object({
    type: z.enum(['tag_name', 'author_name', 'reference_name']),
    value: z.string().trim().min(1).max(200),
    match_mode: z.literal('any').optional(),
  })).min(2).max(4),
})

type EntityNames = {
  tags: string[]
  authors: string[]
  references: string[]
}

type ThemeSuggestion = {
  type: 'tag' | 'author' | 'reference'
  name: string
  description: string
  filters: { type: 'tag_name' | 'author_name' | 'reference_name'; value: string; match_mode: 'any' }[]
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'theme'
}

export function sanitizeThemeAiSuggestions(
  input: unknown,
  entityNames: EntityNames,
  existingSlugs: ReadonlySet<string>,
  maxSuggestions: number,
): ThemeSuggestion[] {
  const rows = Array.isArray(input)
    ? input
    : input && typeof input === 'object' && 'suggestions' in input && Array.isArray(input.suggestions)
      ? input.suggestions
      : []

  const validNames = {
    tag_name: new Map(entityNames.tags.map(name => [name.toLowerCase(), name])),
    author_name: new Map(entityNames.authors.map(name => [name.toLowerCase(), name])),
    reference_name: new Map(entityNames.references.map(name => [name.toLowerCase(), name])),
  }
  const usedSlugs = new Set(existingSlugs)
  const suggestions: ThemeSuggestion[] = []

  for (const row of rows) {
    if (suggestions.length >= maxSuggestions) break

    const parsed = aiSuggestionSchema.safeParse(row)
    if (!parsed.success) continue

    const filters: ThemeSuggestion['filters'] = []
    const filterKeys = new Set<string>()
    for (const filter of parsed.data.filters) {
      const value = validNames[filter.type].get(filter.value.toLowerCase())
      if (!value) continue
      const key = `${filter.type}:${value.toLowerCase()}`
      if (filterKeys.has(key)) continue
      filterKeys.add(key)
      filters.push({ type: filter.type, value, match_mode: 'any' })
    }

    if (filters.length < 2) continue

    const slug = slugify(parsed.data.name)
    if (usedSlugs.has(slug)) continue
    usedSlugs.add(slug)

    suggestions.push({
      type: parsed.data.type,
      name: parsed.data.name,
      description: parsed.data.description,
      filters,
    })
  }

  return suggestions
}
