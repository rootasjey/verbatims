<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Liked Quotes
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Quotes you've liked and want to remember
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="animate-pulse">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Quotes Grid -->
    <div v-else-if="likedQuotes.length > 0">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="quote in likedQuotes"
          :key="quote.id"
          class="relative"
        >
          <QuoteCard :quote="quote" />
          
          <!-- Liked Date -->
          <div class="absolute top-2 left-2">
            <UBadge color="red" variant="soft" size="xs">
              <UIcon name="i-ph-heart-fill" class="w-3 h-3 mr-1" />
              {{ formatDate(quote.liked_at) }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="text-center mt-8">
        <UButton
          variant="outline"
          :loading="loadingMore"
          @click="loadMore"
        >
          Load More Quotes
        </UButton>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-ph-heart" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No liked quotes yet
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Start exploring quotes and like the ones that resonate with you
      </p>
      <UButton to="/quotes">
        Browse Quotes
      </UButton>
    </div>
  </div>
</template>

<script setup>
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// SEO
useHead({
  title: 'Liked Quotes - Verbatims'
})

// Data
const likedQuotes = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)

// Load liked quotes
const loadLikedQuotes = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const response = await $fetch('/api/dashboard/liked-quotes', {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })
    
    if (reset) {
      likedQuotes.value = response.data
    } else {
      likedQuotes.value.push(...response.data)
    }
    
    hasMore.value = response.pagination.hasMore
  } catch (error) {
    console.error('Failed to load liked quotes:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Load more quotes
const loadMore = () => {
  currentPage.value++
  loadLikedQuotes(false)
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Load initial data
onMounted(() => {
  loadLikedQuotes()
})
</script>
