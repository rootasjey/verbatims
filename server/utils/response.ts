import type { PaginationMeta } from '../../shared/types/api'

export function success<T>(data?: T, message?: string) {
  const res: Record<string, any> = { success: true }
  if (data !== undefined) res.data = data
  if (message) res.message = message
  return res
}

export function successWithPagination<T>(data: T, pagination: PaginationMeta, message?: string) {
  const res: Record<string, any> = { success: true, data, pagination }
  if (message) res.message = message
  return res
}
