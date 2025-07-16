<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 py-16 mb-12">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Discover Inspiring
          <span class="text-primary-600 dark:text-primary-400">Quotes</span>
        </h1>
        <p class="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          A comprehensive, user-generated database of wisdom from authors, films, books, and more.
          Curated by the community, moderated for quality.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton size="lg" @click="openSubmitModal" class="btn-hover">
            <UIcon name="i-ph-plus" class="w-5 h-5 mr-2" />
            Submit a Quote
          </UButton>
          <UButton variant="outline" size="lg" to="/authors" class="btn-hover">
            <UIcon name="i-ph-user" class="w-5 h-5 mr-2" />
            Browse Authors
          </UButton>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="mb-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ stats.quotes?.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Quotes</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ stats.authors?.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Authors</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ stats.references?.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">References</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ stats.users?.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Contributors</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quotes Collection -->
    <section>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Discover Quotes
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300">
              Curated wisdom from authors, films, books, and more
            </p>
          </div>
          <UButton variant="ghost" to="/quotes" class="hidden sm:flex">
            View All
            <UIcon name="i-ph-arrow-right" class="w-4 h-4 ml-2" />
          </UButton>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="quotes-grid-enhanced">
          <div v-for="i in 6" :key="i" class="quote-skeleton">
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
              <div class="flex items-center space-x-4">
                <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quotes Grid -->
        <div v-else class="quotes-grid-enhanced">
          <QuoteCard
            v-for="quote in allQuotes"
            :key="quote.id"
            :quote="quote"
            :featured="quote.id === featuredQuote?.id"
            class="quote-grid-item fade-in"
          />
        </div>

        <!-- Load More -->
        <div class="text-center mt-12" v-if="hasMore && !pending">
          <UButton
            variant="outline"
            size="lg"
            :loading="loadingMore"
            @click="loadMore"
            class="btn-hover"
          >
            <UIcon name="i-ph-arrow-down" class="w-4 h-4 mr-2" />
            Load More Quotes
          </UButton>
        </div>

        <!-- Empty State -->
        <div v-if="!pending && allQuotes.length === 0" class="text-center py-16">
          <UIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Be the first to submit a quote!</p>
          <UButton @click="openSubmitModal">Submit Quote</UButton>
        </div>
      </div>
    </section>

    <!-- Submit Quote Dialog -->
    <SubmitQuoteDialog v-model="showSubmitModal" />
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Verbatims - Universal Quotes Database',
  meta: [
    { name: 'description', content: 'Discover inspiring quotes from authors, films, books, and more. A comprehensive, user-generated quotes database with moderation capabilities.' }
  ]
})

// Data fetching
const { data: quotesData, pending } = await useFetch('/api/quotes', {
  query: { limit: 12, status: 'approved' }
})

const { data: statsData } = await useFetch('/api/stats')
const { data: featuredData } = await useFetch('/api/quotes/featured')

// Reactive state
const showSubmitModal = ref(false)
const displayedQuotes = ref(quotesData.value?.data || [])
const hasMore = ref(quotesData.value?.hasMore || false)
const loadingMore = ref(false)
const currentPage = ref(1)

// Computed
const stats = computed(() => statsData.value || { quotes: 0, authors: 0, references: 0, users: 0 })
const featuredQuote = computed(() => featuredData.value?.data)

// Merge featured quote with displayed quotes for unified grid
const allQuotes = computed(() => {
  const quotes = [...(displayedQuotes.value || [])]

  // Add featured quote at the beginning if it exists and isn't already in the list
  if (featuredQuote.value && !quotes.find(q => q.id === featuredQuote.value.id)) {
    quotes.unshift(featuredQuote.value)
  }

  return quotes
})

// Methods
const openSubmitModal = () => {
  showSubmitModal.value = true
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const { data } = await $fetch('/api/quotes', {
      query: {
        limit: 12,
        status: 'approved',
        page: nextPage
      }
    })

    if (data?.data) {
      displayedQuotes.value.push(...data.data)
      hasMore.value = data.hasMore
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error('Failed to load more quotes:', error)
  } finally {
    loadingMore.value = false
  }
}

// Watch for new quotes from modal submission
const refreshQuotes = async () => {
  try {
    const { data } = await $fetch('/api/quotes', {
      query: { limit: 12, status: 'approved' }
    })
    displayedQuotes.value = data?.data || []
    hasMore.value = data?.hasMore || false
    currentPage.value = 1
  } catch (error) {
    console.error('Failed to refresh quotes:', error)
  }
}

// Refresh quotes when modal closes (in case new quote was submitted)
watch(showSubmitModal, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    // Modal was closed, refresh quotes
    refreshQuotes()
  }
})
</script>