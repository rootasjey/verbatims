<template>
  <div class="min-h-screen">
    <header class="p-8">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">Verbatims</h1>
      <span class="-mt-12 text-center font-sans font-400 block text-gray-600 dark:text-gray-400">
        Discover <b>{{ stats.quotes || 0 }}</b> quotes from films, tv series, books, music and more. <br />
        It's an open source community platform. You can post your own funny quotes.
      </span>
    </header>

    <!-- Loading state while language store initializes or quotes are loading -->
    <div v-if="!isLanguageReady || quotesLoading" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !isLanguageReady ? 'Initializing...' : 'Loading quotes...' }}
        </span>
      </div>
    </div>

    <HomeEmptyView
      v-else-if="stats.quotes === 0 || needsOnboarding"
      :needs-onboarding="needsOnboarding"
      :onboarding-status="onboardingStatus"
      :stats="stats"
    />

    <!-- Quotes Grid (when quotes exist) -->
    <div v-else class="mt-6 px-8 pb-16">
      <div class="flex gap-4 font-body mb-8">
        <div class="flex-grow-2 font-600">
          <UInput
            v-model="searchQuery"
            placeholder="Search quotes..."
            leading="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
          />
        </div>
        <div class="flex-1">
          <LanguageSelector @language-changed="onLanguageChange" />
        </div>

        <div class="flex gap-4 items-center">
          <USelect
            v-model="selectedSortBy"
            :items="sortByOptions"
            placeholder="Sort by"
            size="sm"
            item-key="label"
            value-key="label"
          />
          <!-- Order Toggle: OFF = Desc (↓), ON = Asc (↑) -->
          <div class="flex items-center gap-2">
            <UToggle
              v-model="isAsc"
              size="sm"
              :label="isAsc ? 'i-ph-sort-descending-duotone' : 'i-ph-sort-ascending-duotone'"
              :aria-label="isAsc ? 'Ascending' : 'Descending'"
            />
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
        <QuoteGridItem
          v-for="quote in allQuotes"
          :key="(quote as any).id"
          :quote="quote"
        />
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="text-center">
        <UButton
          @click="loadMore"
          :loading="loadingMore"
          :disabled="loadingMore"
          size="sm"
          btn="solid-black"
          class="px-8 py-6 w-full rounded-3 hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
        >
          {{ loadingMore ? 'Loading...' : 'Load More Quotes' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Verbatims • Universal Quotes',
  meta: [
    { 
      name: 'description', 
      content: 'Discover inspiring quotes from authors, films, books, and more. A comprehensive, user-generated NCombobox database with moderation capabilities.',
    }
  ]
})

const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()

// Sorting controls must be defined before useLazyFetch uses them
const selectedSortBy = ref({ label: 'Most Recent', value: 'created_at' })
const selectedSortOrder = ref({ label: 'Desc', value: 'desc' })

const sortByOptions = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Recently Updated', value: 'updated_at' },
  { label: 'Most Liked', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' },
  { label: 'Most Shared', value: 'shares_count' }
]

/** Order toggle computed binding (OFF -> desc, ON -> asc) */
const isAsc = computed({
  get: () => (selectedSortOrder.value?.value || 'desc') === 'asc',
  set: (val: boolean) => {
    selectedSortOrder.value = val
      ? { label: 'Asc', value: 'asc' }
      : { label: 'Desc', value: 'desc' }
  }
})

// Data fetching with reactive language filtering
// Use lazy loading and defer initial fetch until language store is ready
const { data: quotesData, refresh: refreshQuotesFromAPI, pending: quotesLoading } = await useLazyFetch('/api/quotes', {
  query: computed(() => ({
    limit: 25,
    status: 'approved',
    sort_by: selectedSortBy.value?.value || 'created_at',
    sort_order: selectedSortOrder.value?.value || 'desc',
    ...languageStore.getLanguageQuery()
  })),
  // Watch for language and sort changes and refetch
  watch: [
    () => languageStore.currentLanguageValue,
    () => selectedSortBy.value?.value,
    () => selectedSortOrder.value?.value
  ],
  // Defer initial fetch until language store is ready
  server: false, // Don't fetch on server to avoid hydration mismatches
  default: () => ({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
      hasMore: false
    }
  })
})

const { data: statsData } = await useFetch('/api/stats')
const { data: onboardingData } = await useFetch('/api/onboarding/status')

const loadingMore = ref(false)
const currentPage = ref(1)
const additionalQuotes = ref<any[]>([]) // For load more functionality
const searchQuery = ref('')
const loading = ref(false)

const displayedQuotes = computed(() => {
  const baseQuotes = quotesData.value?.data || []
  return [...baseQuotes, ...additionalQuotes.value]
})

const hasMore = computed(() => quotesData.value?.pagination?.hasMore || false)

const stats = computed(() => statsData.value?.data || { quotes: 0, authors: 0, references: 0, users: 0 })
const onboardingStatus = computed(() => onboardingData.value?.data)
const needsOnboarding = computed(() => onboardingStatus.value?.needsOnboarding || false)

const allQuotes = computed(() => displayedQuotes.value || [])

const onLanguageChange = async () => {
  // Reset pagination when language changes
  currentPage.value = 1
  additionalQuotes.value = [] // Clear additional quotes

  // Refresh quotes with new language filter
  await refreshQuotesFromAPI()
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  await waitForLanguageStore()

  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const query: any = {
      limit: 25,
      status: 'approved',
      page: nextPage,
      sort_by: selectedSortBy.value?.value || 'created_at',
      sort_order: selectedSortOrder.value?.value || 'desc'
    }

    // Add language filter
    Object.assign(query, languageStore.getLanguageQuery())

    const response = await $fetch('/api/quotes', { query })

    if (response?.data) {
      additionalQuotes.value = [...additionalQuotes.value, ...response.data]
      currentPage.value = nextPage
    }
  } catch (error) {
    console.error('Failed to load more quotes:', error)
  } finally {
    loadingMore.value = false
  }
}

const refreshQuotes = async () => {
  await waitForLanguageStore()

  // Clear additional quotes and reset pagination
  additionalQuotes.value = []
  currentPage.value = 1

  // Trigger useLazyFetch to refresh with current filters (language + sort)
  await refreshQuotesFromAPI()
}

// Ensure language store is initialized on mount 
// and trigger initial fetch
onMounted(async () => {
  await waitForLanguageStore()
  // Always refresh quotes once language store is ready to ensure correct filtering
  // This is crucial for when a specific language is stored in localStorage
  await refreshQuotes()
})

</script>