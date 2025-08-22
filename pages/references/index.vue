<template>
  <div class="min-h-screen">
    <header class="mt-12 md:mt-0 p-8">
      <h1 class="font-title text-size-16 sm:text-size-28 md:text-size-54 lg:text-size-64 xl:text-size-70 hyphens-auto overflow-hidden break-words font-600 text-center line-height-none uppercase">
        References
      </h1>
      <p class="font-serif text-size-3 md:text-lg text-center text-gray-600 dark:text-gray-400 md:-mt-8">
        Explore the sources behind your favorite quotes, from books and films to speeches and more.
      </p>
    </header>

    <ReferencesEmptyView
      v-if="references.length === 0 && !loading"
      :search-query="searchQuery"
      @open-submit-modal="openSubmitModal"
    />

    <!-- References Content (when references exist) -->
    <div v-else class="px-8 pb-16 md:mt-8">
      <ReferencesSearch
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

      <div v-else>
        <div v-if="!isMobile" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
          <ReferenceGridItem
            v-for="reference in references"
            :key="reference.id"
            :reference="reference"
            class="fade-in"
          />
        </div>

        <!-- Mobile: use ReferenceCard -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-2 mb-12">
          <ReferenceCard
            v-for="reference in references"
            :key="reference.id"
            :reference="reference"
            @click="navigateToReference(reference.id)"
          />
        </div>
      </div>

      <!-- Infinite scroll: desktop uses auto-load at bottom; mobile uses inverted pull-up gesture -->
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
          <UButton v-if="pullDistance < pullThreshold && hasMore" btn="text" @click="loadMore">Pull up to load more</UButton>
          <span v-else-if="hasMore">Release to load more</span>
          <span v-else>No more references</span>
        </div>
      </div>

      <div v-if="loadingMore" class="text-center py-8">
        <UIcon name="i-ph-spinner" class="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading more references...</p>
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

<script setup>
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

const searchQuery = ref('')
const primaryType = ref('')
const sortBy = ref('name')
const sortOrder = ref('ASC')
const references = ref([])
const allFetchedReferences = ref([]) // Store all fetched references for local search
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const showSubmitModal = ref(false)
const totalReferences = ref(0)
const searchInput = ref(null)
const infiniteScrollTrigger = ref(null)
const isSearching = ref(false)
const mobileFiltersOpen = ref(false)

// Inverted pull-to-load-more (mobile)
const pullDistance = ref(0)
const isPulling = ref(false)
const startY = ref(0)
const pullThreshold = 80

const typeOptions = [
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

const sortOptions = [
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
    const response = await $fetch('/api/references', {
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

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadReferences()
}

// Hybrid search function
const performSearch = async (query) => {
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
    const response = await $fetch('/api/references', {
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
    const existingIds = new Set(localResults.map(r => r.id))
    const newResults = apiResults.filter(reference => !existingIds.has(reference.id))

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

const navigateToReference = (referenceId) => {
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

const onPullStart = (e) => {
  if (!isMobile.value || loadingMore.value || !hasMore.value) return
  if (!atBottom()) return
  isPulling.value = true
  startY.value = (e.touches ? e.touches[0]?.clientY : e.clientY) || 0
  pullDistance.value = 0
}

const onPullMove = (e) => {
  if (!isPulling.value) return
  const currentY = (e.touches ? e.touches[0]?.clientY : e.clientY) || 0
  const delta = startY.value - currentY // moving up => positive
  if (delta > 0) {
    pullDistance.value = Math.min(delta, pullThreshold * 1.8)
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

const focusSearchInput = () => {
  nextTick(() => {
    if (searchInput.value?.$el?.querySelector('input')) {
      searchInput.value.$el.querySelector('input').focus()
    }
  })
}

// Cleanup function for infinite scroll
let infiniteScrollCleanup = null

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadReferences()
  // focusSearchInput()

  nextTick(() => {
  // Only enable auto infinite-scroll on desktop; mobile uses pull-up interaction
  infiniteScrollCleanup = !isMobile.value ? setupInfiniteScroll() : null
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
  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadReferences()
  }
})

watch(searchQuery, (newQuery) => {
  debouncedSearch()
})
</script>
