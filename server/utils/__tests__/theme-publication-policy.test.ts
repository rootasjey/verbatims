import { describe, expect, it } from 'vitest'
import { getThemeCacheControl, isThemePublished } from '../theme-publication-policy'

describe('theme publication policy', () => {
  it('exposes only published themes on public surfaces', () => {
    expect(isThemePublished('published')).toBe(true)
    expect(isThemePublished('draft')).toBe(false)
    expect(isThemePublished(undefined)).toBe(false)
  })

  it('prevents shared caching of public themes and private caching of draft previews', () => {
    expect(getThemeCacheControl(false)).toBe('no-store')
    expect(getThemeCacheControl(true)).toBe('private, no-store')
  })
})
