export interface PaginationParams {
  page?: number
  limit?: number
  maxLimit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function getPagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(params.limit || 20, params.maxLimit || 100)
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages
  }
}
