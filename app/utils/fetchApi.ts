interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Record<string, string | number | undefined>
  body?: unknown
  responseType?: 'blob'
  signal?: AbortSignal
}

const typedFetch = $fetch as unknown as <T>(url: string, options?: ApiFetchOptions) => Promise<T>

export function fetchApi<T>(url: string, options?: ApiFetchOptions) {
  return typedFetch<T>(url, options)
}
