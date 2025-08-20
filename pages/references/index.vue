<template>
  <div class="min-h-screen">
    <header class="p-8">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">References</h1>
      <p class="font-serif text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
        Explore the sources behind your favorite quotes, from books and films to speeches and more.
      </p>
    </header>

    <ReferencesEmptyView
      v-if="references.length === 0 && !loading"
      :search-query="searchQuery"
      @open-submit-modal="openSubmitModal"
    />

    <!-- References Content (when references exist) -->
    <div v-else class="px-8 pb-16">
      <!-- Search and Stats -->
      <div class="font-serif mb-8">
        <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400 mb-4">
          Showing {{ references.length }} of {{ totalReferences || 0 }} references
        </span>

        <div class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <div class="flex-1">
            <UInput
              ref="searchInput"
              v-model="searchQuery"
              placeholder="Search references..."
              leading="i-ph-magnifying-glass"
              size="md"
              @input="debouncedSearch"
              class="w-full"
            />
          </div>
          <div class="flex gap-2">
            <USelect
              v-model="primaryType"
              :items="typeOptions"
              placeholder="All Types"
              item-key="label"
              value-key="value"
              @change="loadReferences"
            />
            <USelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Sort by"
              item-key="label"
              value-key="value"
              @change="loadReferences"
            />
            <UButton
              icon
              :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
              variant="outline"
              @click="toggleSortOrder"
            />
          </div>
        </div>
      </div>

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

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
        <ReferenceGridItem
          v-for="reference in references"
          :key="reference.id"
          :reference="reference"
          class="fade-in"
        />
      </div>

      <div ref="infiniteScrollTrigger" class="h-10"></div>

      <div v-if="loadingMore" class="text-center py-8">
        <UIcon name="i-ph-spinner" class="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading more references...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// SEO
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

const refreshReferences = async () => {
  await loadReferences()
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
  loadReferences()
  focusSearchInput()

  nextTick(() => {
    infiniteScrollCleanup = setupInfiniteScroll()
  })
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
  // Let debouncedSearch handle all search logic including empty queries
  debouncedSearch()
})
</script>
