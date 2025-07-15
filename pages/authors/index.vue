<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Authors</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Discover quotes from your favorite authors, both real and fictional.
      </p>
    </div>

    <!-- Search and Filters -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search authors..."
            icon="i-ph-magnifying-glass"
            size="lg"
            @input="debouncedSearch"
          />
        </div>
        <div class="flex gap-2">
          <USelectMenu
            v-model="sortBy"
            :options="sortOptions"
            placeholder="Sort by"
            @change="loadAuthors"
          />
          <UButton
            :icon="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
            variant="outline"
            @click="toggleSortOrder"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="animate-pulse">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Authors Grid -->
    <div v-else-if="authors.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AuthorCard 
        v-for="author in authors" 
        :key="author.id" 
        :author="author"
        class="fade-in"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <UIcon name="i-ph-user" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ searchQuery ? 'No authors found' : 'No authors yet' }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery 
          ? `No authors match "${searchQuery}". Try a different search term.`
          : 'Be the first to submit a quote with an author!'
        }}
      </p>
      <UButton v-if="!searchQuery" @click="openSubmitModal">
        Submit Quote
      </UButton>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="text-center mt-12">
      <UButton 
        variant="outline" 
        size="lg"
        :loading="loadingMore"
        @click="loadMore"
        class="btn-hover"
      >
        <UIcon name="i-ph-arrow-down" class="w-4 h-4 mr-2" />
        Load More Authors
      </UButton>
    </div>

    <!-- Submit Quote Modal -->
    <SubmitQuoteModal v-model="showSubmitModal" />
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Authors - Verbatims',
  meta: [
    { name: 'description', content: 'Browse authors and discover their most inspiring quotes. From historical figures to fictional characters.' }
  ]
})

// Reactive state
const searchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref('ASC')
const authors = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const showSubmitModal = ref(false)

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
    const { data } = await $fetch('/api/authors', {
      query: {
        page: currentPage.value,
        limit: 20,
        search: searchQuery.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    if (reset) {
      authors.value = data.data || []
    } else {
      authors.value.push(...(data.data || []))
    }

    hasMore.value = data.pagination?.hasMore || false
  } catch (error) {
    console.error('Failed to load authors:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Load more authors
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

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  loadAuthors()
}, 300)

// Open submit modal
const openSubmitModal = () => {
  showSubmitModal.value = true
}

// Load authors on mount
onMounted(() => {
  loadAuthors()
})

// Watch for sort changes
watch([sortBy], () => {
  loadAuthors()
})
</script>
