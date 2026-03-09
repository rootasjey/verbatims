export type TimestampInput = string | number | Date | null | undefined

function isSqlDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)
}

function isNumericString(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value)
}

function normalizeEpoch(value: number): number {
  if (!Number.isFinite(value)) return Number.NaN

  const absoluteValue = Math.abs(value)
  return absoluteValue < 1e12 ? value * 1000 : value
}

export function parseTimestampInput(input: TimestampInput): Date | null {
  if (input === null || input === undefined) return null

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : new Date(input.getTime())
  }

  if (typeof input === 'number') {
    const normalizedEpoch = normalizeEpoch(input)
    const date = new Date(normalizedEpoch)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const value = String(input).trim()
  if (!value) return null

  if (isNumericString(value)) {
    const numericValue = Number(value)
    const normalizedEpoch = normalizeEpoch(numericValue)
    const date = new Date(normalizedEpoch)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const normalizedValue = isSqlDateTime(value)
    ? `${value.replace(' ', 'T')}Z`
    : value

  const date = new Date(normalizedValue)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toISOStringOrNull(input: TimestampInput): string | null {
  const date = parseTimestampInput(input)
  return date ? date.toISOString() : null
}

export function toISOStringOrEmpty(input: TimestampInput): string {
  return toISOStringOrNull(input) ?? ''
}