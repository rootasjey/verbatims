import type { ProcessedQuoteResult } from '~~/server/types'
import type { QuoteFeedSnapshot } from '~/stores/quotes'

export type HomeFeedItem =
  | { type: 'quote'; data: ProcessedQuoteResult }
  | { type: 'author'; data: Author }
  | { type: 'reference'; data: QuoteReference }

export interface HomeFeedState {
  quotes: ReturnType<typeof useQuoteSearchFeed>
  authors: Author[]
  references: QuoteReference[]
  initialLoading: Ref<boolean>
}

export function useHomeFeed() {
  const quotesFeed = useQuoteSearchFeed()

  const authors = ref<Author[]>([])
  const references = ref<QuoteReference[]>([])
  const curatedLoading = ref(true)

  const activeTheme = ref<{
    slug: string
    name: string
    description: string | null
    image_url: string | null
    config: Record<string, any> | null
  } | null>(null)

  const isThemed = computed(() => !!activeTheme.value)

  // When themed, replace the quotes feed with a simple ref
  const themedQuotes = ref<ProcessedQuoteResult[]>([])
  const themedLoading = ref(false)

  // Expose a unified quotes ref that switches based on theme mode
  const quotes = computed<ProcessedQuoteResult[]>(() =>
    isThemed.value ? themedQuotes.value : (quotesFeed.quotes.value || [])
  )

  // Fetch a curated batch of authors and references for the home feed
  const fetchCurated = async () => {
    if (isThemed.value) return
    curatedLoading.value = true
    try {
      const [authorsRes, refsRes] = await Promise.all([
        $fetch<ApiResponse<Author[]>>('/api/authors', {
          query: {
            limit: 8,
            sort_by: 'likes_count',
            sort_order: 'DESC',
          },
        }),
        $fetch<ApiResponse<QuoteReference[]>>('/api/references', {
          query: {
            limit: 12,
            sort_by: 'likes_count',
            sort_order: 'DESC',
          },
        }),
      ])

      if (authorsRes.success) {
        authors.value = (authorsRes.data || []).slice(0, 8)
      }
      if (refsRes.success) {
        references.value = (refsRes.data || []).slice(0, 12)
      }
    } catch (error) {
      console.error('Failed to fetch curated home content:', error)
    } finally {
      curatedLoading.value = false
    }
  }

  const fetchThemedFeed = async () => {
    const theme = activeTheme.value
    if (!theme) return
    themedLoading.value = true
    try {
      const res = await $fetch<ApiResponse<{ quotes: ProcessedQuoteResult[]; authors: Author[]; references: QuoteReference[] }>>(`/api/themes/${theme.slug}/feed`)
      if (res.success && res.data) {
        themedQuotes.value = res.data.quotes || []
        authors.value = res.data.authors || []
        references.value = res.data.references || []
      }
    } catch (error) {
      console.error('Failed to fetch themed feed:', error)
    } finally {
      themedLoading.value = false
    }
  }

  // Interleave quotes with authors and references to break linearity
  const mixedItems = computed<HomeFeedItem[]>(() => {
    const q = quotes.value || []
    const auths = authors.value || []
    const refs = references.value || []

    if (!q.length) return []

    const items: HomeFeedItem[] = []
    let authorIndex = 0
    let refIndex = 0

    // Insert an author every 6th slot and a reference every 12th slot
    for (let i = 0; i < q.length; i++) {
      items.push({ type: 'quote', data: q[i]! })

      if ((i + 1) % 6 === 0 && authorIndex < auths.length) {
        items.push({ type: 'author', data: auths[authorIndex]! })
        authorIndex++
      }

      if ((i + 1) % 12 === 0 && refIndex < refs.length) {
        items.push({ type: 'reference', data: refs[refIndex]! })
        refIndex++
      }
    }

    // Append any remaining authors/references at the end
    while (authorIndex < auths.length) {
      items.push({ type: 'author', data: auths[authorIndex]! })
      authorIndex++
    }
    while (refIndex < refs.length) {
      items.push({ type: 'reference', data: refs[refIndex]! })
      refIndex++
    }

    return items
  })

  const setTheme = async (theme: {
    slug: string
    name: string
    description: string | null
    image_url: string | null
    config: Record<string, any> | null
  } | null) => {
    activeTheme.value = theme
    if (theme) {
      await fetchThemedFeed()
    }
  }

  const init = async (snapshot?: QuoteFeedSnapshot | null) => {
    if (isThemed.value) {
      await fetchThemedFeed()
      return
    }
    // Init quotes feed first (it handles language store readiness)
    await quotesFeed.init(snapshot)
    // Then fetch curated content
    await fetchCurated()
  }

  const refresh = async () => {
    if (isThemed.value) {
      await fetchThemedFeed()
      return
    }
    await quotesFeed.refresh()
    await fetchCurated()
  }

  return {
    activeTheme,
    isThemed,
    setTheme,

    // Unified quotes (themed or search feed)
    quotes,
    hasMore: quotesFeed.hasMore,
    loadMore: quotesFeed.loadMore,
    quotesLoading: computed(() => isThemed.value ? themedLoading.value : quotesFeed.quotesLoading.value),
    loadingMore: quotesFeed.loadingMore,
    initialLoading: computed(() => isThemed.value ? themedLoading.value : quotesFeed.initialLoading.value),

    // Curated content
    authors,
    references,
    curatedLoading,

    // Mixed feed
    mixedItems,

    // Actions
    init,
    refresh,

    // Snapshot helpers (forward to quotes feed)
    exportSnapshot: quotesFeed.exportSnapshot,
    hydrateFromSnapshot: quotesFeed.hydrateFromSnapshot,
    updateQuoteInFeed: quotesFeed.updateQuoteInFeed,
    removeQuoteFromFeed: quotesFeed.removeQuoteFromFeed,
  }
}

export type UseHomeFeed = ReturnType<typeof useHomeFeed>
