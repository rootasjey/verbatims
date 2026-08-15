import { describe, expect, it } from 'vitest'
import { combineFilterMatchSets, getThemeContentLanguages } from '../theme-selection'

describe('theme selection', () => {
  it('unions any filters', () => {
    expect(combineFilterMatchSets([
      { ids: [1, 2], matchMode: 'any' },
      { ids: [2, 3], matchMode: 'any' },
    ])).toEqual([1, 2, 3])
  })

  it('intersects all filters', () => {
    expect(combineFilterMatchSets([
      { ids: [1, 2], matchMode: 'all' },
      { ids: [2, 3], matchMode: 'all' },
    ])).toEqual([2])
  })

  it('does not let any filters bypass all filters', () => {
    expect(combineFilterMatchSets([
      { ids: [1, 2], matchMode: 'all' },
      { ids: [2, 3], matchMode: 'any' },
    ])).toEqual([2])
  })

  it('uses the theme language unless explicit language filters exist', () => {
    expect(getThemeContentLanguages('fr', [])).toEqual(['fr'])
    expect(getThemeContentLanguages('fr', [{ type: 'language', value: 'en' }])).toEqual(['en'])
    expect(getThemeContentLanguages(null, [])).toBeNull()
  })
})
