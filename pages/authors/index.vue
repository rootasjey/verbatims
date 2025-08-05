<template>
  <div class="min-h-screen">
    <header class="p-8">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">Authors</h1>
      <p class="font-serif text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
        Discover quotes from your favorite authors, both real and fictional.
      </p>
    </header>

    <!-- Show Empty View if no authors -->
    <AuthorsEmptyView
      v-if="authors.length === 0 && !loading"
      :search-query="searchQuery"
    />

    <!-- Authors Content (when authors exist) -->
    <div v-else class="px-8 pb-16">
      <!-- Search and Stats -->
      <div class="font-serif mb-8">
        <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400 mb-4">
          Showing {{ authors.length }} of {{ totalAuthors || 0 }} authors
        </span>

        <div class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <div class="flex-1">
            <UInput
              ref="searchInput"
              v-model="searchQuery"
              placeholder="Search authors..."
              leading="i-ph-magnifying-glass"
              size="md"
              @input="debouncedSearch"
              class="w-full"
            />
          </div>
          <div class="flex gap-2">
            <USelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Sort by"
              item-key="label"
              value-key="label"
              @change="loadAuthors"
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

      <!-- Authors Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
        <AuthorGridItem
          v-for="author in authors"
          :key="author.id"
          :author="author"
          class="fade-in"
        />
      </div>

      <!-- Infinite Scroll Trigger -->
      <div ref="infiniteScrollTrigger" class="h-10"></div>

      <!-- Loading More Indicator -->
      <div v-if="loadingMore" class="text-center py-8">
        <UIcon name="i-ph-spinner" class="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading more authors...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Authors - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: 'Browse authors and discover their most inspiring quotes. From historical figures to fictional characters.',
    }
  ]
})

// Reactive state
const searchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref('ASC')
const authors = ref([])
const allFetchedAuthors = ref([]) // Store all fetched authors for local search
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const totalAuthors = ref(0)
const searchInput = ref(null)
const infiniteScrollTrigger = ref(null)
const isSearching = ref(false)

// Sort options
const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Popularity', value: 'likes_count' },
  { label: 'Recently Added', value: 'created_at' }
]

// Load authors
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

    const authorsData = response.data.results || []

    if (reset) {
      authors.value = authorsData
      allFetchedAuthors.value = [...authorsData]
    } else {
      authors.value.push(...authorsData)
      allFetchedAuthors.value.push(...authorsData)
    }

    // Get pagination info from response
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

// Load more authors (for infinite scroll)
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadAuthors(false)
}

// Toggle sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadAuthors()
}

// Hybrid search function
const performSearch = async (query) => {
  if (!query || query.trim().length === 0) {
    // No search query, load all authors
    await loadAuthors()
    return
  }

  isSearching.value = true
  const searchTerm = query.trim().toLowerCase()

  // First, search locally in already fetched authors
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

    const apiResults = response.data.results || []

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

// Auto-focus search input
const focusSearchInput = () => {
  nextTick(() => {
    if (searchInput.value?.$el?.querySelector('input')) {
      searchInput.value.$el.querySelector('input').focus()
    }
  })
}

onMounted(() => {
  loadAuthors()
  focusSearchInput()

  nextTick(() => {
    const cleanup = setupInfiniteScroll()

    onUnmounted(() => {
      if (cleanup) cleanup()
    })
  })
})

// Watch for sort changes
watch([sortBy], () => {
  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadAuthors()
  }
})

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (!newQuery || newQuery.trim().length === 0) {
    // Reset to show all authors when search is cleared
    loadAuthors()
  }
})
</script>
