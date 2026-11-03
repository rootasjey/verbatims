import { describe, expect, it } from 'vitest'
import { combineFilterMatchSets, getParisDateKey, getThemeContentLanguages, isThemeWithinSchedule, resolveFeaturedQuoteId } from '../theme-selection'

describe('theme selection', () => {
  it('includes both schedule boundaries and excludes themes after their end date', () => {
    const schedule = {
      scheduledStart: new Date('2026-11-03T00:00:00Z'),
      scheduledEnd: new Date('2026-11-16T23:59:59Z'),
    }

    expect(isThemeWithinSchedule(schedule, Date.parse('2026-11-02T23:59:59Z'))).toBe(false)
    expect(isThemeWithinSchedule(schedule, Date.parse('2026-11-03T00:00:00Z'))).toBe(true)
    expect(isThemeWithinSchedule(schedule, Date.parse('2026-11-16T23:59:59Z'))).toBe(true)
    expect(isThemeWithinSchedule(schedule, Date.parse('2026-11-17T00:00:00Z'))).toBe(false)
  })

  it('supports open-ended schedules for active and default themes', () => {
    expect(isThemeWithinSchedule({ scheduledStart: new Date('2026-11-03T00:00:00Z') }, Date.parse('2026-11-04T00:00:00Z'))).toBe(true)
    expect(isThemeWithinSchedule({ scheduledEnd: new Date('2026-11-03T00:00:00Z') }, Date.parse('2026-11-04T00:00:00Z'))).toBe(false)
    expect(isThemeWithinSchedule({}, Date.parse('2026-11-04T00:00:00Z'))).toBe(true)
  })

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

  it('uses a language-specific featured quote and falls back to the shared quote', () => {
    const config = { featured_quote_id: 2507, featured_quote_ids: { en: 2507, fr: 2519 } }

    expect(resolveFeaturedQuoteId(config, 'fr')).toBe(2519)
    expect(resolveFeaturedQuoteId(config, 'en')).toBe(2507)
    expect(resolveFeaturedQuoteId({ featured_quote_id: 2507 }, 'fr')).toBe(2507)
    expect(resolveFeaturedQuoteId(config)).toBe(2507)
  })

  it('ignores invalid featured quote IDs', () => {
    expect(resolveFeaturedQuoteId({ featured_quote_id: '2507' }, 'fr')).toBeUndefined()
    expect(resolveFeaturedQuoteId({ featured_quote_ids: { fr: 0 } }, 'fr')).toBeUndefined()
    expect(resolveFeaturedQuoteId({ featured_quote_id: 2507, featured_quote_ids: { fr: '2519' } }, 'fr')).toBe(2507)
  })

  it('selects a daily featured quote by Paris date and language', () => {
    const config = {
      featured_quote_id: 2507,
      featured_quote_ids: { en: 2507, fr: 2519 },
      featured_quote_calendar: {
        '2026-11-02': { en: 2520, fr: 2521 },
        '2026-11-03': { en: 2522, fr: 2523 },
      },
    }

    expect(resolveFeaturedQuoteId(config, 'fr', new Date('2026-11-02T22:59:59.999Z'))).toBe(2521)
    expect(resolveFeaturedQuoteId(config, 'en', new Date('2026-11-02T23:00:00.000Z'))).toBe(2522)
    expect(resolveFeaturedQuoteId(config, 'fr', new Date('2026-11-02T23:00:00.000Z'))).toBe(2523)
  })

  it('falls back to existing IDs when the calendar has no valid entry for the date and language', () => {
    const config = {
      featured_quote_id: 2507,
      featured_quote_ids: { en: 2510, fr: 2519 },
      featured_quote_calendar: {
        '2026-11-02': { en: 2520 },
        '2026-11-03': { en: 'invalid', fr: 0 },
      },
    }

    expect(resolveFeaturedQuoteId(config, 'fr', new Date('2026-11-02T23:00:00.000Z'))).toBe(2519)
    expect(resolveFeaturedQuoteId(config, 'en', new Date('2026-11-03T23:00:00.000Z'))).toBe(2510)
    expect(resolveFeaturedQuoteId({ featured_quote_calendar: { '2026-11-03': { fr: 2523 } } }, 'en', new Date('2026-11-03T12:00:00.000Z'))).toBeUndefined()
  })

  it('keeps the Paris date stable around midnight in winter and summer', () => {
    expect(getParisDateKey(new Date('2026-11-02T22:59:59.999Z'))).toBe('2026-11-02')
    expect(getParisDateKey(new Date('2026-11-02T23:00:00.000Z'))).toBe('2026-11-03')
    expect(getParisDateKey(new Date('2026-07-02T21:59:59.999Z'))).toBe('2026-07-02')
    expect(getParisDateKey(new Date('2026-07-02T22:00:00.000Z'))).toBe('2026-07-03')
  })
})
