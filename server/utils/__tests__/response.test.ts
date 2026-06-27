import { describe, it, expect } from 'vitest'
import { success, successWithPagination } from '../response'

describe('success', () => {
  it('returns success true with no data', () => {
    expect(success()).toEqual({ success: true })
  })

  it('returns success true with data', () => {
    expect(success({ id: 1 })).toEqual({ success: true, data: { id: 1 } })
  })

  it('includes message when provided', () => {
    const result = success(null, 'Created')
    expect(result).toEqual({ success: true, data: null, message: 'Created' })
  })

  it('includes message without data', () => {
    expect(success(undefined, 'OK')).toEqual({ success: true, message: 'OK' })
  })
})

describe('successWithPagination', () => {
  const pagination = { page: 1, limit: 20, total: 50, totalPages: 3, hasMore: true }

  it('returns formatted response with pagination', () => {
    const result = successWithPagination([], pagination)
    expect(result).toEqual({
      success: true,
      data: [],
      pagination,
    })
  })

  it('includes optional message', () => {
    const result = successWithPagination([], pagination, 'Fetched')
    expect(result.message).toBe('Fetched')
  })
})
