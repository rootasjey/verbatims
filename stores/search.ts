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

  const suggestedSearches = [
    { text: 'cinema', icon: 'i-ph-film-reel-duotone' },
    { text: 'star wars', icon: 'i-ph-shooting-star-duotone' },
    { text: 'thanos', icon: 'i-ph-skull-duotone' },
    { text: 'la révolution', icon: 'i-ph-hand-fist-duotone' },
    { text: 'Castlevania', icon: 'i-openmoji-bat' },
    { text: 'robots', icon: 'i-ph-robot-duotone' },
    { text: 'philosophy', icon: 'i-ph-brain-duotone' },
    { text: 'science', icon: 'i-ph-atom-duotone' },
    { text: 'la cité de la peur', icon: 'i-openmoji-face-screaming-in-fear' },
    { text: 'animes', icon: 'i-ph-sword-duotone' },
    { text: 'music', icon: 'i-ph-music-notes-duotone' },
    { text: 'art', icon: 'i-ph-palette-duotone' },
    { text: 'love', icon: 'i-ph-heart-duotone' },
    { text: 'friendship', icon: 'i-ph-hands-clapping-duotone' },
    { text: 'tv series', icon: 'i-ph-television' },
    { text: 'history', icon: 'i-ph-book-duotone' },
    { text: 'gaming', icon: 'i-ph-game-controller-duotone' },
    { text: 'litterature', icon: 'i-ph-feather-duotone' },
    { text: 'spirituality', icon: 'i-ph-yin-yang-duotone' },
  ]

  function getRandomSuggestedSearch(max: number = 5) {
    const safeMax = Math.min(max, suggestedSearches.length)
    const shuffled = suggestedSearches.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, safeMax)
  }

  function setQuery(q: string) {
    query.value = q
  }

  function clear() {
    results.value = { quotes: [], authors: [], references: [], total: 0 }
    loading.value = false
  }

  function removeRecent(search: string) {
    recent.value = recent.value.filter(s => s !== search)
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
    clear,
    getRandomSuggestedSearch,
    removeRecent,
    search,
    setQuery,
  }
})
