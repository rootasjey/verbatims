import { describe, expect, it } from 'vitest'
import { formatReferenceReleaseDate } from '../reference-release-date'

describe('reference release dates', () => {
  it('formats numeric and string years without interpreting numeric years as timestamps', () => {
    expect(formatReferenceReleaseDate(1580)).toBe('1580')
    expect(formatReferenceReleaseDate('1580')).toBe('1580')
  })

  it('preserves year ranges and normalizes their dash characters', () => {
    expect(formatReferenceReleaseDate('1751–1772')).toBe('1751–1772')
    expect(formatReferenceReleaseDate('1751-1772')).toBe('1751–1772')
    expect(formatReferenceReleaseDate('1751 — 1772')).toBe('1751–1772')
  })

  it('extracts the year from full dates and omits invalid values', () => {
    expect(formatReferenceReleaseDate('2024-06-01')).toBe('2024')
    expect(formatReferenceReleaseDate('2024-06-01T00:00:00.000Z')).toBe('2024')
    expect(formatReferenceReleaseDate('not-a-date')).toBe('')
    expect(formatReferenceReleaseDate(null)).toBe('')
  })
})
