import { describe, expect, it } from 'vitest'
import {
  formatDashboardQuoteDate,
  formatDashboardQuoteDateRelative,
  formatDashboardQuoteDateTooltip,
  getDashboardQuoteDate,
  getDashboardQuoteDateTimestamp,
} from '../dashboard-quote-date'

describe('dashboard quote dates', () => {
  it('uses moderation time for published quotes when legacy creation time is missing', () => {
    const quote = {
      createdAt: null,
      moderatedAt: '2025-10-15T23:15:32.000Z',
    }

    expect(getDashboardQuoteDate(quote, 'published')).toBe(quote.moderatedAt)
    expect(formatDashboardQuoteDate(quote, 'published')).not.toBeNull()
  })

  it.each(['draft', 'pending'] as const)('uses creation time for %s quotes', (status) => {
    const quote = {
      createdAt: '2026-09-29T22:01:42.000Z',
      updatedAt: '2026-09-30T22:01:42.000Z',
    }

    expect(getDashboardQuoteDate(quote, status)).toBe(quote.createdAt)
    expect(getDashboardQuoteDateTimestamp(quote, status)).toBeGreaterThan(0)
  })

  it('falls back to an available update date and omits missing or invalid dates', () => {
    expect(getDashboardQuoteDate({ createdAt: null, updated_at: '2026-10-01T00:00:00.000Z' }, 'draft'))
      .toBe('2026-10-01T00:00:00.000Z')
    expect(formatDashboardQuoteDate({ createdAt: null, updatedAt: 'not-a-date' }, 'pending')).toBeNull()
  })

  it('formats relative dates and exposes their exact date for a tooltip', () => {
    const quote = { moderatedAt: '2026-07-01T00:00:00.000Z' }
    const now = new Date('2026-10-01T00:00:00.000Z')

    expect(formatDashboardQuoteDateRelative(quote, 'published', 'en', now)).toBe('3 mo. ago')
    expect(formatDashboardQuoteDateTooltip(quote, 'published', 'en-US')).toContain('July 1, 2026')
  })
})
