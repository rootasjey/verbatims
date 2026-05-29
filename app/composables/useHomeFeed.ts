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

  // Fetch a curated batch of authors and references for the home feed
  const fetchCurated = async () => {
    curatedLoading.value = true
    try {
      const [authorsRes, refsRes] = await Promise.all([
        $fetch('/api/authors', {
          query: {
            limit: 8,
            sort_by: 'likes_count',
            sort_order: 'DESC',
          },
        }),
        $fetch('/api/references', {
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

  // Interleave quotes with authors and references to break linearity
  const mixedItems = computed<HomeFeedItem[]>(() => {
    const quotes = quotesFeed.quotes.value || []
    const auths = authors.value || []
    const refs = references.value || []

    if (!quotes.length) return []

    const items: HomeFeedItem[] = []
    let authorIndex = 0
    let refIndex = 0

    // Insert an author every 6th slot and a reference every 12th slot
    for (let i = 0; i < quotes.length; i++) {
      items.push({ type: 'quote', data: quotes[i] })

      if ((i + 1) % 6 === 0 && authorIndex < auths.length) {
        items.push({ type: 'author', data: auths[authorIndex] })
        authorIndex++
      }

      if ((i + 1) % 12 === 0 && refIndex < refs.length) {
        items.push({ type: 'reference', data: refs[refIndex] })
        refIndex++
      }
    }

    // Append any remaining authors/references at the end
    while (authorIndex < auths.length) {
      items.push({ type: 'author', data: auths[authorIndex] })
      authorIndex++
    }
    while (refIndex < refs.length) {
      items.push({ type: 'reference', data: refs[refIndex] })
      refIndex++
    }

    return items
  })

  const init = async (snapshot?: QuoteFeedSnapshot | null) => {
    // Init quotes feed first (it handles language store readiness)
    await quotesFeed.init(snapshot)
    // Then fetch curated content
    await fetchCurated()
  }

  const refresh = async () => {
    await quotesFeed.refresh()
    await fetchCurated()
  }

  return {
    // Quotes feed passthrough
    quotes: quotesFeed.quotes,
    hasMore: quotesFeed.hasMore,
    loadMore: quotesFeed.loadMore,
    quotesLoading: quotesFeed.quotesLoading,
    loadingMore: quotesFeed.loadingMore,
    initialLoading: quotesFeed.initialLoading,

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
