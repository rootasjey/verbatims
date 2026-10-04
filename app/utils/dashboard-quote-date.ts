import type { DateInput } from '~/utils/time-formatter'
import { formatDate, getDateTimestamp, parseDateInput } from '~/utils/time-formatter'

export interface DashboardQuoteDateFields {
  approvedAt?: DateInput
  approved_at?: DateInput
  createdAt?: DateInput
  created_at?: DateInput
  moderatedAt?: DateInput
  updatedAt?: DateInput
  updated_at?: DateInput
}

export type DashboardQuoteStatus = 'draft' | 'pending' | 'published'

export function getDashboardQuoteDate(
  quote: DashboardQuoteDateFields,
  status: DashboardQuoteStatus,
): DateInput | null {
  const candidates = status === 'published'
    ? [quote.moderatedAt, quote.approvedAt, quote.approved_at, quote.createdAt, quote.created_at, quote.updatedAt, quote.updated_at]
    : [quote.createdAt, quote.created_at, quote.updatedAt, quote.updated_at]

  return candidates.find(value => parseDateInput(value) !== null) ?? null
}

export function formatDashboardQuoteDate(
  quote: DashboardQuoteDateFields,
  status: DashboardQuoteStatus,
): string | null {
  const date = getDashboardQuoteDate(quote, status)
  return date === null ? null : formatDate(date)
}

export function formatDashboardQuoteDateRelative(
  quote: DashboardQuoteDateFields,
  status: DashboardQuoteStatus,
  locale: string,
  now: Date = new Date(),
): string | null {
  const date = parseDateInput(getDashboardQuoteDate(quote, status))
  if (!date) return null

  const differenceMs = date.getTime() - now.getTime()
  const absoluteDifferenceMs = Math.abs(differenceMs)
  const units = [
    { unit: 'second' as const, milliseconds: 1_000, limit: 60_000 },
    { unit: 'minute' as const, milliseconds: 60_000, limit: 3_600_000 },
    { unit: 'hour' as const, milliseconds: 3_600_000, limit: 86_400_000 },
    { unit: 'day' as const, milliseconds: 86_400_000, limit: 604_800_000 },
    { unit: 'week' as const, milliseconds: 604_800_000, limit: 2_629_746_000 },
    { unit: 'month' as const, milliseconds: 2_629_746_000, limit: 31_556_952_000 },
    { unit: 'year' as const, milliseconds: 31_556_952_000, limit: Number.POSITIVE_INFINITY },
  ]
  const { unit, milliseconds } = units.find(candidate => absoluteDifferenceMs < candidate.limit) ?? units[units.length - 1]!
  const value = Math.round(differenceMs / milliseconds)

  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' }).format(value, unit)
}

export function formatDashboardQuoteDateTooltip(
  quote: DashboardQuoteDateFields,
  status: DashboardQuoteStatus,
  locale: string,
): string | null {
  const date = parseDateInput(getDashboardQuoteDate(quote, status))
  if (!date) return null

  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

export function getDashboardQuoteDateTimestamp(
  quote: DashboardQuoteDateFields,
  status: DashboardQuoteStatus,
): number {
  return getDateTimestamp(getDashboardQuoteDate(quote, status))
}
