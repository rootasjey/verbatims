<template>
  <div class="min-h-screen">
    <header class="mt-12 md:mt-0 p-8">
      <h1 class="font-title hyphens-auto overflow-hidden break-words font-600 text-center line-height-none uppercase">
        Authors
      </h1>
      <p class="font-serif text-size-3 md:text-lg text-center text-gray-600 dark:text-gray-400">
        Discover quotes from your favorite authors, both real and fictional.
      </p>
    </header>

    <div class="px-8 pb-16">
      <AuthorsSearch
        ref="searchInput"
        :authors-count="authors.length"
        :total-authors="totalAuthors"
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        :sort-order="sortOrder"
        :sort-options="sortOptions"
        v-model:mobile-filters-open="mobileFiltersOpen"
        @toggle-sort-order="toggleSortOrder"
      />

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
        <div v-for="i in 8" :key="i" class="border p-6 animate-pulse">
          <div class="border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 mb-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>

      <AuthorsEmptyView
        v-else-if="authors.length === 0"
        :search-query="searchQuery"
        class="mt-24"
        @clear-filters="clearFilters"
        @open-submit-modal="openSubmitModal"
      />

      <div v-else>
        <div v-if="!isMobile" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
          <AuthorGridItem
            v-for="author in authors"
            :key="author.id"
            :author="author"
            class="fade-in"
          />
        </div>

        <!-- Mobile: small horizontal cards -->
        <div v-else class="space-y-2 px-2 mb-12">
          <AuthorCard v-for="author in authors" :key="author.id" :author="author" />
        </div>
      </div>

      <div class="flex justify-center">
        <LoadMoreButton 
          v-if="authors.length > 0 && hasMore"
          class="mb-4" 
          idleText="Load More Authors" 
          loadingText="Loading Authors..." 
          :isLoading="loadingMore" 
          @load="loadMore"
          data-test="load-more-authors"
        />
      </div>
    </div>
    
    <MobileSortAuthors
      v-if="isMobile"
      v-model:open="mobileFiltersOpen"
      v-model:sortBy="sortBy"
      :sort-order="sortOrder"
      :sort-options="sortOptions"
      @toggle-sort-order="toggleSortOrder"
    />
  </div>
</template>

<script lang="ts" setup>
import { useJsonLd } from '~/composables/useSeo'
import { useAuthorsListStore } from '~/stores/authors'
import type { AuthorsListSnapshot } from '~/stores/authors'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const authorsListStore = useAuthorsListStore()

definePageMeta({
  layout: false
})

useHead({
  title: 'Authors - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: 'Browse authors and discover their most inspiring quotes. From historical figures to fictional characters.',
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: 'Authors', item: 'https://verbatims.cc/authors' }
  ]
})

const searchQuery = ref<string>('')
const sortBy = ref<string>('name')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')
const authors: Ref<Author[]> = ref([])
const allFetchedAuthors: Ref<Author[]> = ref([]) // Store all fetched authors for local search
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const totalAuthors = ref<number>(0)
const searchInput = ref<any>(null)
const isSearching = ref(false)
const mobileFiltersOpen = ref(false)
const isRestoringState = ref(false)

const saveCurrentAuthorsState = () => {
  authorsListStore.saveSnapshot({
    authors: authors.value,
    allFetchedAuthors: allFetchedAuthors.value,
    currentPage: currentPage.value,
    hasMore: hasMore.value,
    totalAuthors: totalAuthors.value,
    searchQuery: searchQuery.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0
  })
}

const debouncedSaveScrollState = useDebounceFn(() => {
  if (isRestoringState.value) return
  saveCurrentAuthorsState()
}, 100)

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Popularity', value: 'likes_count' },
  { label: 'Recently Added', value: 'created_at' }
]

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder="Search authors..."]'
})

// Optional page-level submit modal (keeps parity with references page)
const showSubmitModal = ref<boolean>(false)
const openSubmitModal = () => { showSubmitModal.value = true }

// Clear filters helper used by the empty view
const clearFilters = async () => {
  searchQuery.value = ''
  await loadAuthors()
}

const restoreAuthorsState = async (snapshot: AuthorsListSnapshot) => {
  isRestoringState.value = true

  searchQuery.value = snapshot.searchQuery
  sortBy.value = snapshot.sortBy
  sortOrder.value = snapshot.sortOrder
  authors.value = [...snapshot.authors]
  allFetchedAuthors.value = [...snapshot.allFetchedAuthors]
  currentPage.value = snapshot.currentPage
  hasMore.value = snapshot.hasMore
  totalAuthors.value = snapshot.totalAuthors
  loading.value = false
  loadingMore.value = false

  await nextTick()
  isRestoringState.value = false
}

const loadAuthors = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    authors.value = []
  } else {
    loadingMore.value = true
  }

  try {
    type AuthorsApiResponse = {
      success: boolean
      data: any[]
      pagination?: { hasMore: boolean; total: number }
    }

    const response = await $fetch<AuthorsApiResponse>('/api/authors', {
      query: {
        page: currentPage.value,
        limit: 20,
        search: searchQuery.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const authorsData = response.data || []

    if (reset) {
      authors.value = authorsData
      allFetchedAuthors.value = [...authorsData]
    } else {
      authors.value.push(...authorsData)
      allFetchedAuthors.value.push(...authorsData)
    }

    hasMore.value = response.pagination?.hasMore ?? false
    totalAuthors.value = response.pagination?.total ?? 0
  } catch (error) {
    console.error('Failed to load authors:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadAuthors(false)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadAuthors()
}

// Hybrid search function
const performSearch = async (query: string) => {
  if (!query || query.trim().length === 0) {
    await loadAuthors()
    return
  }

  isSearching.value = true
  const searchTerm = query.trim().toLowerCase()

  const localResults = allFetchedAuthors.value.filter(author =>
    author.name.toLowerCase().includes(searchTerm) ||
    (author.job && author.job.toLowerCase().includes(searchTerm)) ||
    (author.description && author.description.toLowerCase().includes(searchTerm))
  )

  // Show local results immediately
  authors.value = localResults

  // Then search API for additional results
  try {
    const response = await $fetch('/api/authors', {
      query: {
        page: 1,
        limit: 50, // Get more results for search
        search: query,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const apiResults = response.data || []

    // Merge results, avoiding duplicates
    const existingIds = new Set(localResults.map(a => a.id))
    const newResults = apiResults.filter(author => !existingIds.has(author.id))

    authors.value = [...localResults, ...newResults]
    totalAuthors.value = response.pagination?.total || authors.value.length
    hasMore.value = false // Disable infinite scroll during search
  } catch (error) {
    console.error('Failed to search authors:', error)
    // Keep local results on API error
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  performSearch(searchQuery.value)
}, 300)

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedSaveScrollState)
  }
})


onMounted(() => {
  setPageLayout(currentLayout.value)

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedSaveScrollState, { passive: true })
  }

  const shouldRestore = authorsListStore.shouldRestore
  const storedSnapshot = authorsListStore.snapshot
  const snapshot = storedSnapshot
    ? {
        ...storedSnapshot,
        authors: [...storedSnapshot.authors],
        allFetchedAuthors: [...storedSnapshot.allFetchedAuthors]
      }
    : null

  const initializePage = async () => {
    if (shouldRestore && snapshot) {
      await restoreAuthorsState(snapshot)
      await nextTick()

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: snapshot.scrollY, behavior: 'auto' })
      }

      authorsListStore.clearRestoreRequest()
    } else {
      await loadAuthors()
    }

    await nextTick()
    // Pagination is button-driven only.
  }

  void initializePage()
})

onBeforeRouteLeave((to) => {
  if (typeof window === 'undefined') return

  saveCurrentAuthorsState()

  if (to.path.startsWith('/authors/')) {
    authorsListStore.requestRestore()
  } else {
    authorsListStore.clearRestoreRequest()
  }
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

watch([sortBy], () => {
  if (isRestoringState.value) return

  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadAuthors()
  }
})

watch(searchQuery, (newQuery) => {
  if (isRestoringState.value) return

  if (!newQuery || newQuery.trim().length === 0) {
    loadAuthors()
    return
  }

  debouncedSearch()
})

watch(
  [authors, allFetchedAuthors, currentPage, hasMore, totalAuthors, searchQuery, sortBy, sortOrder],
  () => {
    if (isRestoringState.value) return
    saveCurrentAuthorsState()
  },
  { deep: true }
)
</script>

<style scoped>
header h1 {
  font-size: 4.0rem;
  transition: font-size 0.3s ease;

  @media (min-width: 480px)   { font-size: 8.0rem;  }
  @media (min-width: 768px)   { font-size: 10.0rem; }
  @media (min-width: 812px)   { font-size: 12.0rem; }
  @media (min-width: 912px)   { font-size: 13.5rem; }
  @media (min-width: 1024px)  { font-size: 15.0rem; }
  @media (min-width: 1124px)  { font-size: 18.0rem; }
  @media (min-width: 1224px)  { font-size: 20.5rem; }
}
</style>