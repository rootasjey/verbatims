import { defineStore } from 'pinia'
import type { SearchResults, SearchApiResponse } from '~/types'

interface SearchOptions {
  limit?: number
  language?: string | number
  author?: string | number
  reference?: string | number
}

export const useSearchStore = defineStore('search', () => {
  const query = ref<string>('')
  const results = ref<SearchResults>({ quotes: [], authors: [], references: [], total: 0 })
  const loading = ref<boolean>(false)
  const recent = ref<string[]>([])
  const lastFetchedAt = ref<number | null>(null)

  let abortController: AbortController | null = null

  function setQuery(q: string) {
    query.value = q
  }

  function clear() {
    results.value = { quotes: [], authors: [], references: [], total: 0 }
    loading.value = false
  }

  const hasResults = computed(() => (results.value?.total || 0) > 0)
  const isStale = (maxAgeMs = 2 * 60 * 1000) =>
    !lastFetchedAt.value || Date.now() - lastFetchedAt.value > maxAgeMs

  async function search(options: SearchOptions = {}) {
    const { limit = 20, language, author, reference } = options
    const q = query.value.trim()
    if (!q) {
      clear()
      return
    }

    if (abortController) abortController.abort()
    abortController = typeof AbortController !== 'undefined' ? new AbortController() : null

    loading.value = true
    try {
      const fetchQuery: Record<string, any> = { q, limit }
      if (language) fetchQuery.language = language
      if (author) fetchQuery.author = author
      if (reference) fetchQuery.reference = reference

      const data = await $fetch<SearchApiResponse>('/api/search', {
        query: fetchQuery,
        signal: abortController?.signal
      })

      results.value = (data?.data as SearchResults) ?? { quotes: [], authors: [], references: [], total: 0 }
      lastFetchedAt.value = Date.now()

      if (!recent.value.includes(q)) {
        recent.value.unshift(q)
        recent.value = recent.value.slice(0, 5)
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Search error:', err)
        results.value = { quotes: [], authors: [], references: [], total: 0 }
      }
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    query,
    results,
    loading,
    recent,

    // getters
    hasResults,
    isStale,

    // methods / actions
    setQuery,
    clear,
    search
  }
})
