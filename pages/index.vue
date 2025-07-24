<template>
  <div class="min-h-screen light:bg-purple-100">
    <header class="p-8">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">Verbatims</h1>
    </header>

    <!-- Onboarding Section -->
    <div v-if="needsOnboarding" class="px-8 mb-6 font-text">
      <h2 class="font-600 line-height-none">Welcome to Verbatims!</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Get started by setting up your application:
      </p>
      <div class="flex gap-4">
        <UButton
          v-if="onboardingStatus?.step === 'admin_user' || !onboardingStatus?.hasAdminUser"
          btn="link"
          to="/onboarding/admin"
          class="p-0"
        >
          1. Create Admin User
        </UButton>
        <UButton
          v-else-if="onboardingStatus?.step === 'database_data' || !onboardingStatus?.hasData"
          btn="link"
          to="/onboarding/database"
          class="p-0"
        >
          2. Initialize Database
        </UButton>
      </div>
    </div>

    <!-- Empty State (when onboarding is complete but no quotes) -->
    <div v-else-if="stats.quotes === 0" class="px-8 mb-6 font-text">
      <h2 class="font-600 line-height-none mb-4">Ready to start collecting quotes!</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Your database is set up. Start by submitting your first quote.
      </p>
      <UButton @click="showSubmitModal = true" class="px-4 py-2">
        Submit Your First Quote
      </UButton>
    </div>

    <HomeEmptyView />

    <!-- Stats and Load More (when quotes exist) -->
    <div v-if="stats.quotes > 0" class="p-8 max-w-lg font-text">
      <span class="mb-6 block">
        There are {{ stats.quotes }} quotes in the database.
      </span>

      <UButton btn="solid-black" label="Load more quotes" rounded="3" class="w-full px-12 py-6" />
    </div>
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Verbatims • Universal Quotes',
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
const { data: onboardingData } = await useFetch('/api/onboarding/status')
console.log("onboardingData.value?.data: ", onboardingData.value)

// Reactive state
const showSubmitModal = ref(false)
const displayedQuotes = ref(quotesData.value?.data || [])
const hasMore = ref(quotesData.value?.hasMore || false)
const loadingMore = ref(false)
const currentPage = ref(1)

// Computed
const stats = computed(() => statsData.value || { quotes: 0, authors: 0, references: 0, users: 0 })
const featuredQuote = computed(() => featuredData.value?.data)
const onboardingStatus = computed(() => onboardingData.value?.data)
const needsOnboarding = computed(() => onboardingStatus.value?.needsOnboarding || false)

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