import { describe, it, expect } from 'vitest'
import { parseTimestampInput, toISOStringOrNull } from '../date-normalization'

describe('parseTimestampInput', () => {
  it('returns null for null input', () => {
    expect(parseTimestampInput(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parseTimestampInput(undefined)).toBeNull()
  })

  it('parses a Date object', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const result = parseTimestampInput(date)
    expect(result).toBeInstanceOf(Date)
    expect(result!.toISOString()).toBe('2024-01-15T10:30:00.000Z')
  })

  it('returns null for invalid Date', () => {
    expect(parseTimestampInput(new Date('invalid'))).toBeNull()
  })

  it('parses epoch milliseconds', () => {
    const date = new Date('2024-06-15T10:30:00.000Z')
    const ts = date.getTime()
    const result = parseTimestampInput(ts)
    expect(result!.toISOString()).toBe(date.toISOString())
  })

  it('normalizes epoch seconds to milliseconds', () => {
    const date = new Date('2024-06-15T10:30:00.000Z')
    const ts = Math.floor(date.getTime() / 1000)
    const result = parseTimestampInput(ts)
    expect(result!.toISOString()).toBe(date.toISOString())
  })

  it('parses ISO 8601 string', () => {
    const result = parseTimestampInput('2024-01-15T10:30:00.000Z')
    expect(result!.toISOString()).toBe('2024-01-15T10:30:00.000Z')
  })

  it('parses SQL datetime format', () => {
    const result = parseTimestampInput('2024-01-15 10:30:00')
    expect(result).toBeInstanceOf(Date)
  })

  it('returns null for empty string', () => {
    expect(parseTimestampInput('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseTimestampInput('   ')).toBeNull()
  })
})

describe('toISOStringOrNull', () => {
  it('returns null for null input', () => {
    expect(toISOStringOrNull(null)).toBeNull()
  })

  it('returns ISO string for valid date', () => {
    const result = toISOStringOrNull(new Date('2024-01-15T10:30:00Z'))
    expect(result).toBe('2024-01-15T10:30:00.000Z')
  })

  it('returns null for invalid date', () => {
    expect(toISOStringOrNull(new Date('invalid'))).toBeNull()
  })
})
