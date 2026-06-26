/**
 * Shared API response wrapper type used across server and client
 */

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export type ApiResponse<T = unknown> = {
  /** Whether the API call was successful */
  success: boolean
  /** Payload data (optional for endpoints that don't return data) */
  data?: T
  /** Human-readable message */
  message?: string
  /** Optional array of error messages */
  errors?: string[]
  /** Pagination metadata (when response is paginated) */
  pagination?: PaginationMeta
}
