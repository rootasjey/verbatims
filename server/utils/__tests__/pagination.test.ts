import { describe, it, expect } from 'vitest'
import { getPagination, buildPaginationMeta } from '../../services/pagination.service'

describe('getPagination', () => {
  it('returns defaults for empty input', () => {
    const result = getPagination({})
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 })
  })

  it('clamps page to minimum of 1', () => {
    expect(getPagination({ page: 0 }).page).toBe(1)
    expect(getPagination({ page: -5 }).page).toBe(1)
  })

  it('uses provided page, limit, and calculates offset', () => {
    const result = getPagination({ page: 3, limit: 10 })
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 })
  })

  it('caps limit to default maxLimit of 100', () => {
    const result = getPagination({ limit: 500 })
    expect(result.limit).toBe(100)
  })

  it('respects custom maxLimit', () => {
    const result = getPagination({ limit: 50, maxLimit: 30 })
    expect(result.limit).toBe(30)
  })
})

describe('buildPaginationMeta', () => {
  it('returns correct meta for first page', () => {
    const result = buildPaginationMeta(50, 1, 20)
    expect(result).toEqual({
      page: 1, limit: 20, total: 50, totalPages: 3, hasMore: true,
    })
  })

  it('returns hasMore false for last page', () => {
    const result = buildPaginationMeta(50, 3, 20)
    expect(result.hasMore).toBe(false)
  })

  it('returns hasMore false for single page', () => {
    const result = buildPaginationMeta(5, 1, 20)
    expect(result.hasMore).toBe(false)
    expect(result.totalPages).toBe(1)
  })

  it('handles zero total', () => {
    const result = buildPaginationMeta(0, 1, 20)
    expect(result.totalPages).toBe(0)
    expect(result.hasMore).toBe(false)
  })

  it('handles exact division', () => {
    const result = buildPaginationMeta(40, 2, 20)
    expect(result.totalPages).toBe(2)
    expect(result.hasMore).toBe(false)
  })
})
