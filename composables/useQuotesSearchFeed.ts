import type { QuotesSearchPayload } from '~/types/search'

// types/sort.d.ts is likely a global declaration file, not a module.
// So we reference the type name directly instead of importing.
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

  // Sorting controls
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

  // Pagination / UI state
  const loadingMore = ref(false)
  const currentPage = ref(1)
  const additionalQuotes = ref<any[]>([])
  const searchQuery = ref('')

  // Data retention and initial load control
  const initialLoading = ref(true)
  const lastSuccessfulQuotes = ref<any[]>([])
  const lastSuccessfulMeta = ref<{
    total: number
    page: number
    limit: number
    offset: number
    pageCount: number
    sort: SortMode
    q?: string
    hasMore: boolean
  }>({
    total: 0,
    page: 1,
    limit: 25,
    offset: 0,
    pageCount: 0,
    sort: 'recent',
    q: undefined,
    hasMore: false
  })

  // Debounced search
  const debouncedQuery = ref('')
  const applyDebounce = useDebounceFn(() => {
    debouncedQuery.value = searchQuery.value.trim()
  }, 250)

  // Keep debouncedQuery in sync when user types
  watch(searchQuery, () => {
    applyDebounce()
  })

  // Nudge refresh when sort controls change (also applies debounce so empty query still refetches)
  watch(
    () => selectedSortBy.value?.value,
    () => {
      // reset to page 1 and trigger search debounced update
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

  // Fetch
  const { data: quotesData, refresh: refreshQuotesFromAPI, pending: quotesLoading } = useLazyFetch('/api/quotes/search', {
    query: computed(() => {
      const isAscending = (selectedSortOrder.value?.value || 'desc') === 'asc'
      const sort = mapSort(selectedSortBy.value?.value, !!debouncedQuery.value)
      return {
        q: debouncedQuery.value || undefined,
        sort,
        sortOrder: isAscending ? 'asc' : 'desc',
        page: currentPage.value,
        limit: 25,
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
        limit: 25,
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
    // reset page when user types to ensure results start from first page
    currentPage.value = 1
  })

  watch(quotesData, (val) => {
    const payload = (val as any)?.data
    const quotes = payload?.quotes
    if (Array.isArray(quotes)) {
      lastSuccessfulQuotes.value = quotes

      lastSuccessfulMeta.value = {
        total: typeof payload?.total === 'number' ? payload.total : lastSuccessfulMeta.value.total,
        page: typeof payload?.page === 'number' ? payload.page : lastSuccessfulMeta.value.page,
        limit: typeof payload?.limit === 'number' ? payload.limit : lastSuccessfulMeta.value.limit,
        offset: typeof payload?.offset === 'number' ? payload.offset : lastSuccessfulMeta.value.offset,
        pageCount: typeof payload?.pageCount === 'number' ? payload.pageCount : lastSuccessfulMeta.value.pageCount,
        sort: (payload?.sort as SortMode) || lastSuccessfulMeta.value.sort,
        q: payload?.q ?? lastSuccessfulMeta.value.q,
        hasMore: typeof payload?.hasMore === 'boolean' ? payload.hasMore : lastSuccessfulMeta.value.hasMore,
      }

      if (initialLoading.value) initialLoading.value = false
    }
  }, { immediate: true })

  // Re-run first page when debounced query changes
  watch(debouncedQuery, () => {
    currentPage.value = 1
  })

  const searchData = computed<QuotesSearchPayload | null>(() => {
    const d = quotesData.value?.data as any
    if (!d) return null
    if ('quotes' in d) return d as QuotesSearchPayload
    if ('data' in d && Array.isArray(d.data)) {
      return {
        sort: 'recent',
        page: 1,
        limit: 25,
        q: undefined,
        quotes: [],
        total: 0,
        offset: 0,
        pageCount: 0,
        filters: {},
        hasMore: false
      }
    }
    return null
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

      const query: any = {
        q: searchQuery.value?.trim() || undefined,
        sort,
        sortOrder: isAscending ? 'asc' : 'desc',
        page: nextPage,
        limit: 25,
        ...languageStore.getLanguageQuery()
      }

      const response = await $fetch('/api/quotes/search', { query })

      if ((response as any)?.data?.quotes) {
        additionalQuotes.value = [...additionalQuotes.value, ...(((response as any).data.quotes) || [])]
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

  const init = async () => {
    await waitForLanguageStore()
    await refresh()
  }

  // Public surface
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
    quotes: computed(() => displayedQuotes.value || []),
    hasMore,
    meta,

    // actions
    init,
    refresh,
    loadMore,
    onLanguageChange,

    // options
    sortByOptions
  }
}

/** Exported alias stays in sync with the function's return shape */
export type UseQuoteSearchFeed = ReturnType<typeof useQuoteSearchFeed>