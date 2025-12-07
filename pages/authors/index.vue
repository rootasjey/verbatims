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

    <AuthorsEmptyView
      v-if="authors.length === 0 && !loading"
      :search-query="searchQuery"
    />

    <div v-else class="px-8 pb-16">
      <AuthorsSearch
        :authors-count="authors.length"
        :total-authors="totalAuthors"
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        :sort-order="sortOrder"
        :sort-options="sortOptions"
        v-model:mobile-filters-open="mobileFiltersOpen"
        @toggle-sort-order="toggleSortOrder"
        @change-sort="loadAuthors"
        @search-input="debouncedSearch"
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

      <!-- Infinite scroll: desktop keeps auto-load at bottom; mobile uses inverted pull-up gesture -->
      <div v-if="!isMobile" ref="infiniteScrollTrigger" class="h-10"></div>

      <!-- Mobile inverted pull-to-load-more (pull up from bottom) -->
      <div
        v-else
        class="overflow-hidden select-none"
        :style="{ height: `${Math.max(40, pullDistance)}px` }"
        @touchstart.passive="onPullStart"
        @touchmove="onPullMove"
        @touchend="onPullEnd"
      >
        <div class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          <NButton v-if="pullDistance < pullThreshold && hasMore" btn="text" @click="loadMore">Pull up to load more</NButton>
          <span v-else-if="hasMore">Release to load more</span>
          <span v-else>No more authors</span>
        </div>
      </div>

      <LoadMoreButton 
        class="mb-4" 
        idleText="load more authors" 
        loadingText="loading authors..." 
        :isLoading="loadingMore" 
        @load="loadMore"
      />
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
import type { Author } from '~/types/author'
import type { Ref } from 'vue'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

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
const infiniteScrollTrigger = ref<HTMLElement | null>(null)
// Inverted pull-to-load-more (mobile)
const pullDistance = ref(0)
const isPulling = ref(false)
const startY = ref(0)
const pullThreshold = 80
const isSearching = ref(false)
const mobileFiltersOpen = ref(false)

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Popularity', value: 'likes_count' },
  { label: 'Recently Added', value: 'created_at' }
]

const loadAuthors = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    authors.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response = await $fetch('/api/authors', {
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

    const paginationInfo = response.pagination || {}

    hasMore.value = paginationInfo.hasMore || false
    totalAuthors.value = paginationInfo.total || 0
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

const setupInfiniteScroll = () => {
  if (!infiniteScrollTrigger.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
        loadMore()
      }
    },
    {
      rootMargin: '100px'
    }
  )

  observer.observe(infiniteScrollTrigger.value)

  return () => {
    observer.disconnect()
  }
}

// Helpers and handlers for mobile pull-up
const atBottom = () => {
  const scrollEl = document.scrollingElement || document.documentElement
  return scrollEl.scrollHeight - (scrollEl.scrollTop + window.innerHeight) <= 2
}

const onPullStart = (e: TouchEvent | MouseEvent) => {
  if (!isMobile.value || loadingMore.value || !hasMore.value) return
  if (!atBottom()) return
  isPulling.value = true
  startY.value = ((e as TouchEvent).touches 
    ? (e as TouchEvent).touches[0]?.clientY 
    : (e as MouseEvent).clientY) || 0

    pullDistance.value = 0
}

const onPullMove = (e: TouchEvent | MouseEvent) => {
  if (!isPulling.value) return
  const currentY = ((e as TouchEvent).touches 
    ? (e as TouchEvent).touches[0]?.clientY 
    : (e as MouseEvent).clientY) || 0

  const delta = startY.value - currentY // moving up => positive
  if (delta > 0) {
    // Cap a bit above threshold for a rubber-band feel
    pullDistance.value = Math.min(delta, pullThreshold * 1.8)
    // Prevent native bounce while actively pulling
    if (e.cancelable) e.preventDefault()
  } else {
    pullDistance.value = 0
  }
}

const onPullEnd = async () => {
  if (!isPulling.value) return
  const shouldLoad = pullDistance.value >= pullThreshold
  isPulling.value = false
  pullDistance.value = 0
  if (shouldLoad && hasMore.value && !loadingMore.value) {
    await loadMore()
  }
}


onMounted(() => {
  setPageLayout(currentLayout.value)
  loadAuthors()

  nextTick(() => {
  // Only enable auto infinite-scroll on desktop; mobile uses pull-up interaction
  const cleanup = !isMobile.value ? setupInfiniteScroll() : undefined

    onUnmounted(() => {
      if (cleanup) cleanup()
    })
  })
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

watch([sortBy], () => {
  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadAuthors()
  }
})

watch(searchQuery, (newQuery) => {
  if (!newQuery || newQuery.trim().length === 0) {
    loadAuthors()
  }
})
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