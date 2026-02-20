<template>
  <div class="min-h-screen">
    <header class="mt-12 md:mt-0 p-8">
      <h1 class="font-title hyphens-auto overflow-hidden break-words font-600 text-center line-height-none uppercase">
        References
      </h1>
      <p class="font-serif text-size-3 md:text-lg text-center text-gray-600 dark:text-gray-400">
        Explore the sources behind your favorite quotes, from books and films to speeches and more.
      </p>
    </header>

    <div class="px-8 pb-16 md:mt-8">
      <ReferencesSearch
        ref="searchInput"
        :visible-count="references.length"
        :total-count="totalReferences || 0"
        v-model:search-query="searchQuery"
        v-model:primary-type="primaryType"
        v-model:sort-by="sortBy"
        :sort-order="sortOrder"
        :type-options="typeOptions"
        :sort-options="sortOptions"
        @toggle-sort-order="toggleSortOrder"
        @open-mobile-filters="mobileFiltersOpen = true"
      />

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

      <ReferencesEmptyView
        v-else-if="referencesForDisplay.length === 0"
        :search-query="searchQuery"
        :selected-type="primaryType"
        class="mt-24"
        @clear-filters="clearFilters"
        @open-submit-modal="openSubmitModal"
      />

      <div v-else>
        <div v-if="!isMobile" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
          <ReferenceGridItem
            v-for="reference in referencesForDisplay"
            :key="reference.id"
            :reference="reference"
            class="fade-in"
          />
        </div>

        <!-- Mobile: use ReferenceCard -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-2 mb-12">
          <ReferenceCard
            v-for="reference in referencesForDisplay"
            :key="reference.id"
            :reference="reference"
            @click="navigateToReference(reference.id)"
          />
        </div>
      </div>

      <!-- Infinite scroll: desktop uses auto-load at bottom; mobile uses inverted pull-up gesture -->
      <div v-if="referencesForDisplay.length > 0 && !isMobile" ref="infiniteScrollTrigger" class="h-10"></div>

      <!-- Mobile inverted pull-to-load-more (pull up from bottom) -->
      <div
        v-else-if="referencesForDisplay.length > 0"
        class="overflow-hidden select-none"
        :style="{ height: `${Math.max(40, pullDistance)}px` }"
        @touchstart.passive="onPullStart"
        @touchmove="onPullMove"
        @touchend="onPullEnd"
      >
        <div class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          <NButton v-if="pullDistance < pullThreshold && hasMore" btn="text" @click="loadMore">Pull up to load more</NButton>
          <span v-else-if="hasMore">Release to load more</span>
          <span v-else>No more references</span>
        </div>
      </div>
      
      <div class="flex justify-center">
        <LoadMoreButton 
          v-if="referencesForDisplay.length > 0"
          class="mb-4" 
          idleText="Load More References" 
          loadingText="Loading References..." 
          :isLoading="loadingMore" 
          @load="loadMore"
        />
      </div>
    </div>

    <!-- Mobile filters drawer -->
    <MobileSortReferences
      v-if="isMobile"
      v-model:open="mobileFiltersOpen"
      v-model:sortBy="sortBy"
      v-model:primaryType="primaryType"
      :sort-order="sortOrder"
      :sort-options="sortOptions"
      :type-options="typeOptions"
      @toggle-sort-order="toggleSortOrder"
    />
  </div>
</template>

<script lang="ts" setup>
import { useMobileDetection, useLayoutSwitching } from '~/composables/useMobileDetection'
import { useDebounceFn } from '@vueuse/core'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false
})

useHead({
  title: 'References - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: 'Browse quote references and discover the sources behind inspiring quotes. From books and films to speeches and more.',
    }
  ]
})

const searchQuery = ref<string>('')
const primaryType = ref<string>('')
const sortBy = ref<string>('name')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')
const references = ref<QuoteReferenceWithMetadata[]>([])
const allFetchedReferences = ref<QuoteReferenceWithMetadata[]>([]) // Store all fetched references for local search
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const showSubmitModal = ref<boolean>(false)
const totalReferences = ref<number>(0)
const searchInput = ref<any>(null)
const infiniteScrollTrigger = ref<HTMLElement | null>(null)
const isSearching = ref<boolean>(false)
const mobileFiltersOpen = ref<boolean>(false)
const isProgrammaticReset = ref<boolean>(false)

// Inverted pull-to-load-more (mobile)
const pullDistance = ref<number>(0)
const isPulling = ref<boolean>(false)
const startY = ref<number>(0)
const pullThreshold = 80

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder="Search references..."]'
})

type Option = { label: string; value: string }

const typeOptions: Option[] = [
  { label: 'All Types', value: '' },
  { label: 'Books', value: 'book' },
  { label: 'Films', value: 'film' },
  { label: 'TV Series', value: 'tv_series' },
  { label: 'Music', value: 'music' },
  { label: 'Speeches', value: 'speech' },
  { label: 'Podcasts', value: 'podcast' },
  { label: 'Interviews', value: 'interview' },
  { label: 'Documentaries', value: 'documentary' },
  { label: 'Media Streams', value: 'media_stream' },
  { label: 'Writings', value: 'writings' },
  { label: 'Video Games', value: 'video_game' },
  { label: 'Other', value: 'other' }
]

const sortOptions: Option[] = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Popularity', value: 'likes_count' },
  { label: 'Release Date', value: 'release_date' },
  { label: 'Recently Added', value: 'created_at' }
]

const loadReferences = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    references.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response: any = await $fetch('/api/references', {
      query: {
        page: currentPage.value,
        limit: 20,
        search: searchQuery.value || undefined,
        primary_type: primaryType.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

  const referencesData = Array.isArray(response.data) ? response.data : []

    if (reset) {
      references.value = referencesData
      allFetchedReferences.value = [...referencesData]
    } else {
      references.value = [...references.value, ...referencesData]
      allFetchedReferences.value = [...allFetchedReferences.value, ...referencesData]
    }

    const paginationInfo = response.pagination || {}

    hasMore.value = paginationInfo.hasMore || false
    totalReferences.value = paginationInfo.total || 0
  } catch (error) {
    console.error('Failed to load references:', error)
    if (reset) {
      references.value = []
      allFetchedReferences.value = []
    }
    
    hasMore.value = false
    totalReferences.value = 0
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadReferences(false)
}

import { computed } from 'vue'

// Ensure components that expect QuoteReference (which has urls: string)
// receive the proper shape. Convert parsed urls back to JSON string when needed.
const referencesForDisplay = computed(() => {
  return references.value.map((r) => ({
    ...r,
    urls: typeof r.urls === 'string' ? r.urls : JSON.stringify(r.urls || {})
  }))
})

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadReferences()
}

// Hybrid search function
const performSearch = async (query: string) => {
  if (!query || query.trim().length === 0) {
    // No search query, restore from cached references or load all
    if (allFetchedReferences.value.length > 0) {
      references.value = [...allFetchedReferences.value]
      totalReferences.value = allFetchedReferences.value.length
      hasMore.value = allFetchedReferences.value.length >= 20 // Re-enable infinite scroll if we have enough items
    } else {
      await loadReferences()
    }
    return
  }

  isSearching.value = true
  const searchTerm = query.trim().toLowerCase()

  // First, search locally in already fetched references
  const localResults = allFetchedReferences.value.filter(reference =>
    reference.name.toLowerCase().includes(searchTerm) ||
    (reference.description && reference.description.toLowerCase().includes(searchTerm)) ||
    (reference.secondary_type && reference.secondary_type.toLowerCase().includes(searchTerm))
  )

  // Show local results immediately
  references.value = localResults

  // Then search API for additional results
  try {
    const response: any = await $fetch('/api/references', {
      query: {
        page: 1,
        limit: 50, // Get more results for search
        search: query,
        primary_type: primaryType.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

  const apiResults = Array.isArray(response.data?.results) ? response.data.results :
            Array.isArray(response.data) ? response.data : []

    // Merge results, avoiding duplicates
      const existingIds = new Set(localResults.map((r) => r.id))
      const newResults = apiResults.filter((reference: QuoteReferenceWithMetadata) => !existingIds.has(reference.id))

    references.value = [...localResults, ...newResults]
    totalReferences.value = response.pagination?.total || references.value.length
    hasMore.value = false // Disable infinite scroll during search
  } catch (error) {
    console.error('Failed to search references:', error)
    // Keep local results on API error
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  performSearch(searchQuery.value)
}, 300)

const openSubmitModal = () => {
  showSubmitModal.value = true
}

const clearFilters = async () => {
  isProgrammaticReset.value = true
  searchQuery.value = ''
  primaryType.value = ''
  await loadReferences()
  isProgrammaticReset.value = false
}

const navigateToReference = (referenceId: number | string) => {
  navigateTo(`/references/${referenceId}`)
}

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

  observer.observe(infiniteScrollTrigger.value as Element)

  return () => {
    observer.disconnect()
  }
}

// Helpers and handlers for mobile pull-up
const atBottom = () => {
  const scrollEl = (document.scrollingElement || document.documentElement) as HTMLElement
  return scrollEl.scrollHeight - (scrollEl.scrollTop + window.innerHeight) <= 2
}

const onPullStart = (e: TouchEvent | MouseEvent) => {
  if (!isMobile.value || loadingMore.value || !hasMore.value) return
  if (!atBottom()) return
  isPulling.value = true
  startY.value = ((e as TouchEvent).touches ? (e as TouchEvent).touches[0]?.clientY : (e as MouseEvent).clientY) || 0
  pullDistance.value = 0
}

const onPullMove = (e: TouchEvent | MouseEvent) => {
  if (!isPulling.value) return
  const currentY = ((e as TouchEvent).touches ? (e as TouchEvent).touches[0]?.clientY : (e as MouseEvent).clientY) || 0
  const delta = startY.value - currentY // moving up => positive
  if (delta > 0) {
    pullDistance.value = Math.min(delta, pullThreshold * 1.8)
    if ((e as TouchEvent).cancelable || (e as MouseEvent & { cancelable?: boolean }).cancelable) {
      // Some synthetic mouse events may not be cancelable
      try { (e as TouchEvent).preventDefault?.() } catch {}
    }
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

const focusSearchInput = () => {
  nextTick(() => {
    const el = searchInput.value?.$el || searchInput.value
    const input = el?.querySelector?.('input')
    if (input && typeof input.focus === 'function') input.focus()
  })
}

let infiniteScrollCleanup: (() => void) | null = null

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadReferences()

  nextTick(() => {
  // Only enable auto infinite-scroll on desktop; mobile uses pull-up interaction
  infiniteScrollCleanup = !isMobile.value ? (setupInfiniteScroll() ?? null) : null
  })
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

onUnmounted(() => {
  if (infiniteScrollCleanup) {
    infiniteScrollCleanup()
  }
})

watch([sortBy, primaryType], () => {
  if (isProgrammaticReset.value) return

  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadReferences()
  }
})

watch(searchQuery, (newQuery) => {
  if (isProgrammaticReset.value) return

  debouncedSearch()
})
</script>

<style scoped>
header h1 {
  font-size: 3.0rem;
  transition: font-size 0.3s ease;

  @media (min-width: 480px)   { font-size: 8.5rem;  }
  @media (min-width: 768px)   { font-size: 10.0rem; }
  @media (min-width: 854px)   { font-size: 11.0rem; }
  @media (min-width: 912px)   { font-size: 12.0rem; }
  @media (min-width: 1024px)  { font-size: 13.0rem; }
  @media (min-width: 1124px)  { font-size: 15.0rem; }
  @media (min-width: 1224px)  { font-size: 16.0rem; }
  @media (min-width: 1424px)  { font-size: 18.0rem; }
}
</style>
