import { describe, it, expect } from 'vitest'
import { getSortParams, parseSort, parseSortOrder } from '../sort'

describe('getSortParams', () => {
  it('returns defaults when no input given', () => {
    const result = getSortParams()
    expect(result).toEqual({ sort_by: 'created_at', sort_order: 'desc' })
  })

  it('returns defaults for empty object', () => {
    const result = getSortParams({})
    expect(result).toEqual({ sort_by: 'created_at', sort_order: 'desc' })
  })

  it('uses provided sort_by when valid', () => {
    const result = getSortParams({ sort_by: 'likes_count' })
    expect(result.sort_by).toBe('likes_count')
  })

  it('falls back to default for invalid sort_by', () => {
    const result = getSortParams({ sort_by: 'invalid_column' as any })
    expect(result.sort_by).toBe('created_at')
  })

  it('uses asc order when specified', () => {
    const result = getSortParams({ sort_order: 'asc' })
    expect(result.sort_order).toBe('asc')
  })

  it('falls back to desc for invalid order', () => {
    const result = getSortParams({ sort_order: 'invalid' as any })
    expect(result.sort_order).toBe('desc')
  })

  it('respects custom allowed columns', () => {
    const allowed = ['name', 'email']
    const result = getSortParams({ sort_by: 'name' }, allowed)
    expect(result.sort_by).toBe('name')
  })

  it('falls back for custom column not in allowed list', () => {
    const allowed = ['name', 'email']
    const result = getSortParams({ sort_by: 'created_at' }, allowed)
    expect(result.sort_by).toBe('created_at')
  })
})

describe('parseSort', () => {
  it('returns relevance as default', () => {
    expect(parseSort(null)).toBe('relevance')
  })

  it('returns relevance for undefined', () => {
    expect(parseSort(undefined)).toBe('relevance')
  })

  it('parses "recent"', () => {
    expect(parseSort('recent')).toBe('recent')
  })

  it('parses "popular"', () => {
    expect(parseSort('popular')).toBe('popular')
  })

  it('case-insensitive', () => {
    expect(parseSort('RECENT')).toBe('recent')
    expect(parseSort('Popular')).toBe('popular')
  })

  it('falls back to relevance for unknown values', () => {
    expect(parseSort('random')).toBe('relevance')
  })
})

describe('parseSortOrder', () => {
  it('returns desc as default', () => {
    expect(parseSortOrder(null)).toBe('desc')
  })

  it('returns desc for undefined', () => {
    expect(parseSortOrder(undefined)).toBe('desc')
  })

  it('parses "asc"', () => {
    expect(parseSortOrder('asc')).toBe('asc')
  })

  it('case-insensitive', () => {
    expect(parseSortOrder('ASC')).toBe('asc')
  })

  it('falls back to desc for unknown values', () => {
    expect(parseSortOrder('random')).toBe('desc')
  })
})
