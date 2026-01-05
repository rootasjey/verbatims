import type { ProcessedQuoteResult, QuotesSearchPayload } from "~~/server/types"

type SortMode = 'relevance' | 'recent' | 'popular'

/**
 * Map UI sort settings to API sort mode.
 * - If query is present => relevance
 * - Else created_at => recent
 * - Else likes/views/shares => popular
 */
function mapSort(uiSortBy: string | undefined, hasQuery: boolean): SortMode {
  if (hasQuery) return 'relevance'
  if (uiSortBy === 'created_at' || !uiSortBy) return 'recent'
  if (uiSortBy === 'likes_count' || uiSortBy === 'views_count' || uiSortBy === 'shares_count') return 'popular'
  return 'recent'
}

export function useQuoteSearchFeed() {
  const languageStore = useLanguageStore()
  const { waitForLanguageStore } = useLanguageReady()

  const selectedSortBy = ref<{ label: string; value: string }>({ label: 'Most Recent', value: 'created_at' })
  const selectedSortOrder = ref<{ label: string; value: 'asc' | 'desc' }>({ label: 'Desc', value: 'desc' })
  const sortByOptions = [
    { label: 'Most Recent', value: 'created_at' },
    { label: 'Recently Updated', value: 'updated_at' },
    { label: 'Most Liked', value: 'likes_count' },
    { label: 'Most Viewed', value: 'views_count' },
    { label: 'Most Shared', value: 'shares_count' }
  ]

  const isAsc = computed<boolean>({
    get: () => (selectedSortOrder.value?.value || 'desc') === 'asc',
    set: (val: boolean) => {
      selectedSortOrder.value = val
        ? { label: 'Asc', value: 'asc' }
        : { label: 'Desc', value: 'desc' }
    }
  })

  const loadingMore = ref(false)
  const currentPage = ref(1)
  const additionalQuotes = ref<ProcessedQuoteResult[]>([])
  const searchQuery = ref('')

  const limit = 50
  const initialLoading = ref(true)
  const lastSuccessfulQuotes = ref<ProcessedQuoteResult[]>([])
  const lastSuccessfulMeta = ref({
    total: 0,
    page: 1,
    limit,
    offset: 0,
    pageCount: 0,
    sort: 'recent' as SortMode,
    q: undefined as string | undefined,
    hasMore: false
  })

  const debouncedQuery = ref('')
  const applyDebounce = useDebounceFn(() => {
    debouncedQuery.value = searchQuery.value.trim()
  }, 250)

  watch(searchQuery, () => {
    applyDebounce()
  })

  watch(
    () => selectedSortBy.value?.value,
    () => {
      currentPage.value = 1
      applyDebounce()
    }
  )
  watch(
    () => selectedSortOrder.value?.value,
    () => {
      currentPage.value = 1
      applyDebounce()
    }
  )

  const { data: quotesData, refresh: refreshQuotesFromAPI, pending: quotesLoading } = useLazyFetch('/api/quotes/search', {
    query: computed(() => {
      const isAscending = (selectedSortOrder.value?.value || 'desc') === 'asc'
      const sort = mapSort(selectedSortBy.value?.value, !!debouncedQuery.value)
      return {
        q: debouncedQuery.value || undefined,
        sort,
        sortOrder: isAscending ? 'asc' : 'desc',
        page: currentPage.value,
        limit,
        ...languageStore.getLanguageQuery()
      }
    }),
    watch: [
      () => languageStore.currentLanguageValue,
      () => selectedSortBy.value?.value,
      () => selectedSortOrder.value?.value,
      () => debouncedQuery.value,
      () => currentPage.value
    ],
    server: false,
    default: () => ({
      success: true,
      data: {
        quotes: [],
        total: 0,
        page: 1,
        limit,
        offset: 0,
        pageCount: 0,
        sort: 'recent' as SortMode,
        q: undefined as string | undefined,
        filters: {},
        hasMore: false
      }
    })
  })

  // Keep previous data during refetch and mark initial loading off after first success
  watch(searchQuery, () => {
    currentPage.value = 1
  })

  watch(quotesData, (val) => {
    const payload = val.data
    const quotes = payload?.quotes
    if (Array.isArray(quotes)) {
      lastSuccessfulQuotes.value = quotes as ProcessedQuoteResult[]

      lastSuccessfulMeta.value = {
        total: typeof payload?.total === 'number' ? payload.total : lastSuccessfulMeta.value.total,
        page: typeof payload?.page === 'number' ? payload.page : lastSuccessfulMeta.value.page,
        limit: typeof payload?.limit === 'number' ? payload.limit : lastSuccessfulMeta.value.limit,
        offset: typeof payload?.offset === 'number' ? payload.offset : lastSuccessfulMeta.value.offset,
        pageCount: typeof payload?.pageCount === 'number' ? payload.pageCount : lastSuccessfulMeta.value.pageCount,
        sort: (payload?.sort as SortMode) || lastSuccessfulMeta.value.sort,
        q: payload?.q ?? lastSuccessfulMeta.value.q,
        hasMore: typeof (payload as any)?.hasMore === 'boolean' ? (payload as any).hasMore : lastSuccessfulMeta.value.hasMore,
      }

      if (initialLoading.value) initialLoading.value = false
    }
  }, { immediate: true })

  watch(debouncedQuery, () => {
    currentPage.value = 1
  })

  const searchData = computed<QuotesSearchPayload | undefined>(() => {
    const data = quotesData.value?.data as any
    if (!data) return undefined
    if ('quotes' in data) return data as QuotesSearchPayload
    if ('data' in data && Array.isArray(data.data)) {
      return {
        sort: 'recent',
        page: 1,
        limit: limit,
        q: undefined,
        quotes: [],
        total: 0,
        offset: 0,
        pageCount: 0,
        filters: {},
        hasMore: false
      }
    }
    return undefined
  })

  const displayedQuotes = computed(() => {
    const baseQuotes = lastSuccessfulQuotes.value.length
      ? lastSuccessfulQuotes.value
      : (searchData.value?.quotes || [])
    return [...baseQuotes, ...additionalQuotes.value]
  })

  const hasMore = computed(() => {
    if (typeof lastSuccessfulMeta.value.hasMore === 'boolean') {
      return lastSuccessfulMeta.value.hasMore
    }
    return searchData.value?.hasMore || false
  })

  const meta = computed(() => lastSuccessfulMeta.value)

  const onLanguageChange = async () => {
    currentPage.value = 1
    additionalQuotes.value = []
    await refreshQuotesFromAPI()
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    await waitForLanguageStore()

    loadingMore.value = true
    try {
      const nextPage = currentPage.value + 1
      const sort = mapSort(selectedSortBy.value?.value, !!searchQuery.value?.trim())
      const isAscending = (selectedSortOrder.value?.value || 'desc') === 'asc'

      const query = {
        q: searchQuery.value?.trim() || undefined,
        sort,
        sortOrder: isAscending ? 'asc' : 'desc',
        page: nextPage,
        limit,
        ...languageStore.getLanguageQuery()
      }

      const response = await $fetch('/api/quotes/search', { query })

      if (response.data?.quotes) {
        additionalQuotes.value = [...additionalQuotes.value, ...(response.data.quotes as ProcessedQuoteResult[] || [])]
        currentPage.value = nextPage
      }
    } catch (error) {
      console.error('Failed to load more quotes:', error)
    } finally {
      loadingMore.value = false
    }
  }

  const refresh = async () => {
    await waitForLanguageStore()
    additionalQuotes.value = []
    currentPage.value = 1
    await refreshQuotesFromAPI()
  }

  // Allow parent components to update quotes locally without a full refresh
  const updateQuoteInFeed = (updated: ProcessedQuoteResult) => {
    if (!updated || typeof updated.id !== 'number') return
    
    const baseIndex = lastSuccessfulQuotes.value.findIndex(q => q.id === updated.id)
    if (baseIndex !== -1) {
      lastSuccessfulQuotes.value[baseIndex] = { ...lastSuccessfulQuotes.value[baseIndex], ...updated }
      return
    }

    const additionalIndex = additionalQuotes.value.findIndex(q => q.id === updated.id)
    if (additionalIndex !== -1) {
      additionalQuotes.value[additionalIndex] = { ...additionalQuotes.value[additionalIndex], ...updated }
    }
  }

  const removeQuoteFromFeed = (id: number) => {
    if (typeof id !== 'number') return
    const before = lastSuccessfulQuotes.value.length + additionalQuotes.value.length
    lastSuccessfulQuotes.value = lastSuccessfulQuotes.value.filter(q => q.id !== id)
    additionalQuotes.value = additionalQuotes.value.filter(q => q.id !== id)
    const after = lastSuccessfulQuotes.value.length + additionalQuotes.value.length
    // Best-effort meta update
    if (after < before) {
      lastSuccessfulMeta.value.total = Math.max(0, (lastSuccessfulMeta.value.total || 0) - (before - after))
    }
  }

  const init = async () => {
    await waitForLanguageStore()
    await refresh()
  }

  return {
    // state
    searchQuery,
    selectedSortBy,
    isAsc,

    // status
    initialLoading,
    quotesLoading,
    loadingMore,

    // data
    quotes: displayedQuotes,
    hasMore,
    meta,

    // actions
    init,
    refresh,
    loadMore,
    onLanguageChange,

    // options
    sortByOptions,

    // local update helpers
    updateQuoteInFeed,
    removeQuoteFromFeed,
  }
}

/** Exported alias stays in sync with the function's return shape */
export type UseQuoteSearchFeed = ReturnType<typeof useQuoteSearchFeed>