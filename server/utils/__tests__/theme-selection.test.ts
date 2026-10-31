import { describe, expect, it } from 'vitest'
import { combineFilterMatchSets, getThemeContentLanguages, isThemeWithinSchedule } from '../theme-selection'

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
})
