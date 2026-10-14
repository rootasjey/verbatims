import { describe, expect, it } from 'vitest'
import { sanitizeThemeAiSuggestions } from '../theme-ai-suggestions'

const entities = {
  tags: ['Courage', 'Hope'],
  authors: ['Maya Angelou'],
  references: ['Letters to a Young Poet'],
}

const validSuggestion = {
  type: 'tag',
  name: 'Quiet Courage',
  description: 'Words about courage and hope.',
  filters: [
    { type: 'tag_name', value: 'courage', match_mode: 'any' },
    { type: 'tag_name', value: 'Hope', match_mode: 'any' },
  ],
}

describe('theme AI suggestions', () => {
  it('accepts valid suggestions and canonicalizes entity names', () => {
    expect(sanitizeThemeAiSuggestions(
      { suggestions: [validSuggestion] },
      entities,
      new Set(),
      6,
    )).toEqual([{
      type: 'tag',
      name: 'Quiet Courage',
      description: 'Words about courage and hope.',
      filters: [
        { type: 'tag_name', value: 'Courage', match_mode: 'any' },
        { type: 'tag_name', value: 'Hope', match_mode: 'any' },
      ],
    }])
  })

  it('drops invented filters and rejects suggestions left with fewer than two valid filters', () => {
    expect(sanitizeThemeAiSuggestions([{
      ...validSuggestion,
      filters: [
        { type: 'tag_name', value: 'Courage' },
        { type: 'author_name', value: 'An invented author' },
      ],
    }], entities, new Set(), 6)).toEqual([])
  })

  it('drops malformed suggestions, duplicate filters, and existing theme slugs', () => {
    expect(sanitizeThemeAiSuggestions([
      { ...validSuggestion, name: 'Existing Theme' },
      { ...validSuggestion, name: 'Duplicate Filters', filters: [
        { type: 'tag_name', value: 'Courage' },
        { type: 'tag_name', value: 'courage' },
      ] },
      { ...validSuggestion, name: '' },
      { ...validSuggestion, description: '   ' },
    ], entities, new Set(['existing-theme']), 6)).toEqual([])
  })

  it('deduplicates generated names and respects the requested maximum', () => {
    const result = sanitizeThemeAiSuggestions([
      validSuggestion,
      { ...validSuggestion, name: 'Quiet Courage' },
      { ...validSuggestion, name: 'Brave Hope' },
    ], entities, new Set(), 1)

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Quiet Courage')
  })
})
