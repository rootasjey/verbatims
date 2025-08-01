<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Public Collections
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Discover curated collections of quotes shared by the community
      </p>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search collections..."
            leading="i-ph-magnifying-glass"
            @input="debouncedSearch"
          />
        </div>
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          @change="loadCollections"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 9" :key="i" class="animate-pulse">
        <UCard>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </UCard>
      </div>
    </div>

    <!-- Collections Grid -->
    <div v-else-if="collections.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="collection in collections"
        :key="collection.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/collections/${collection.id}`)"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-1">
                {{ collection.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ collection.quotes_count }} quotes
              </p>
            </div>
            <UBadge color="green" variant="subtle" size="xs">
              Public
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="collection.description">
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ collection.description }}
            </p>
          </div>

          <!-- Creator Info -->
          <div class="flex items-center space-x-3">
            <UAvatar
              :src="collection.user_avatar"
              :alt="collection.user_name"
              size="xs"
              :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
            />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ collection.user_name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Created {{ formatDate(collection.created_at) }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Updated {{ formatDate(collection.updated_at) }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-ph-bookmark" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No public collections found
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a public collection!' }}
      </p>
      <UButton v-if="user" to="/dashboard/collections">
        Create Collection
      </UButton>
      <UButton v-else to="/login">
        Sign In to Create Collections
      </UButton>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="text-center mt-8">
      <UButton
        variant="outline"
        :loading="loadingMore"
        @click="loadMore"
      >
        Load More Collections
      </UButton>
    </div>
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Public Collections - Verbatims',
  meta: [
    { name: 'description', content: 'Discover curated collections of quotes shared by the Verbatims community.' }
  ]
})

const { user } = useUserSession()

// Data
const collections = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const searchQuery = ref('')
const sortBy = ref('updated')

// Options
const sortOptions = [
  { label: 'Recently Updated', value: 'updated' },
  { label: 'Recently Created', value: 'created' },
  { label: 'Most Quotes', value: 'quotes' },
  { label: 'Alphabetical', value: 'name' }
]

// Load collections
const loadCollections = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const params = {
      page: currentPage.value,
      limit: 12,
      public: 'true'
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // Add sorting
    switch (sortBy.value) {
      case 'created':
        params.sort = 'created_at'
        params.order = 'desc'
        break
      case 'quotes':
        params.sort = 'quotes_count'
        params.order = 'desc'
        break
      case 'name':
        params.sort = 'name'
        params.order = 'asc'
        break
      default: // updated
        params.sort = 'updated_at'
        params.order = 'desc'
    }

    const response = await $fetch('/api/collections', { query: params })
    
    if (reset) {
      collections.value = response.data
    } else {
      collections.value.push(...response.data)
    }
    
    hasMore.value = response.pagination.hasMore
  } catch (error) {
    console.error('Failed to load collections:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  loadCollections()
}, 300)

// Load more collections
const loadMore = () => {
  currentPage.value++
  loadCollections(false)
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Load initial data
onMounted(() => {
  loadCollections()
})

// Watch for sort changes
watch(sortBy, () => {
  loadCollections()
})
</script>
