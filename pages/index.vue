<template>
  <div class="min-h-screen">
    <header class="p-8 overflow-hidden">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">Verbatims</h1>
    </header>

    <HomeEmptyView
      v-if="stats.quotes === 0 || needsOnboarding"
      :needs-onboarding="needsOnboarding"
      :onboarding-status="onboardingStatus"
      :stats="stats"
      @open-submit-modal="openSubmitModal"
    />

    <!-- Quotes Grid (when quotes exist) -->
    <div v-else class="px-8 pb-16">
      <!-- Stats -->
      <div class="font-body mb-8">
        <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400">
          Showing {{ allQuotes.length }} of {{ stats.quotes || 0 }} quotes
        </span>

        <div class="flex items-center justify-center">
          <UCombobox
            v-model="selectedLanguage"
            :items="languages"
            by="value"
            :_combobox-input="{
              placeholder: 'Select language...',
            }"
            @update:model-value="onLanguageChange"
          >
            <template #trigger="{ modelValue }">
              <template v-if="modelValue && typeof modelValue === 'object' && 'icon' in modelValue">
                <div class="flex items-center gap-2">
                  <UIcon :name="(modelValue as any).icon" />
                  {{ (modelValue as any).display }}
                </div>
              </template>
              <template v-else>
                Select language...
              </template>
            </template>

            <template #label="{ item }">
              <UIcon :name="(item as any).icon" />
              {{ (item as any).display }}
            </template>
          </UCombobox>
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

    <!-- Submit Quote Modal -->
    <SubmitQuoteDialog v-model="showSubmitModal" @submitted="refreshQuotes" />
  </div>
</template>

<script lang="ts" setup>
// SEO
useHead({
  title: 'Verbatims • Universal Quotes',
  meta: [
    { 
      name: 'description', 
      content: 'Discover inspiring quotes from authors, films, books, and more. A comprehensive, user-generated NCombobox database with moderation capabilities.',
    }
  ]
})

// Language selection state
const selectedLanguage = ref({ value: 'all', display: 'All Languages', icon: 'i-openmoji-globe-showing-americas' })

// Data fetching with reactive language filtering
const { data: quotesData, refresh: refreshQuotesData } = await useFetch('/api/quotes', {
  query: computed(() => ({
    limit: 25,
    status: 'approved',
    ...(selectedLanguage.value.value !== 'all' && { language: selectedLanguage.value.value })
  }))
})

const { data: statsData } = await useFetch('/api/stats')
const { data: onboardingData } = await useFetch('/api/onboarding/status')

// Reactive state
const showSubmitModal = ref(false)
const displayedQuotes = ref([...(quotesData.value?.data || [])])
const hasMore = ref(quotesData.value?.pagination?.hasMore || false)
const loadingMore = ref(false)
const currentPage = ref(1)

// Computed
const stats = computed(() => statsData.value?.data || { quotes: 0, authors: 0, references: 0, users: 0 })
const onboardingStatus = computed(() => onboardingData.value?.data)
const needsOnboarding = computed(() => onboardingStatus.value?.needsOnboarding || false)

// Use displayed quotes directly for now (simplified)
const allQuotes = computed(() => displayedQuotes.value || [])

// Methods
const openSubmitModal = () => {
  showSubmitModal.value = true
}

// Language options
const languages = [
  { value: 'all', display: 'All Languages', icon: 'i-openmoji-globe-showing-americas' },
  { value: 'en', display: 'English', icon: 'i-openmoji-hamburger' },
  { value: 'fr', display: 'French', icon: 'i-openmoji-baguette-bread' },
  // { value: 'es', display: 'Spanish', icon: 'i-ph-flag' },
  // { value: 'de', display: 'German', icon: 'i-ph-flag' },
  // { value: 'it', display: 'Italian', icon: 'i-ph-flag' },
  // { value: 'pt', display: 'Portuguese', icon: 'i-ph-flag' },
  // { value: 'ru', display: 'Russian', icon: 'i-ph-flag' },
  // { value: 'ja', display: 'Japanese', icon: 'i-ph-flag' },
  // { value: 'zh', display: 'Chinese', icon: 'i-ph-flag' }
]

// Language change handler
const onLanguageChange = async () => {
  // Reset pagination when language changes
  currentPage.value = 1
  hasMore.value = false

  // Refresh quotes with new language filter
  await refreshQuotesData()

  // Update displayed quotes and pagination
  displayedQuotes.value = [...(quotesData.value?.data || [])]
  hasMore.value = quotesData.value?.pagination?.hasMore || false
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const query: any = {
      limit: 25,
      status: 'approved',
      page: nextPage
    }

    // Add language filter if not "all"
    if (selectedLanguage.value.value !== 'all') {
      query.language = selectedLanguage.value.value
    }

    const response = await $fetch('/api/quotes', { query })

    if (response?.data) {
      displayedQuotes.value = [...displayedQuotes.value, ...response.data]
      hasMore.value = response.pagination?.hasMore || false
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
    const query: any = { limit: 25, status: 'approved' }

    // Add language filter if not "all"
    if (selectedLanguage.value.value !== 'all') {
      query.language = selectedLanguage.value.value
    }

    const response = await $fetch('/api/quotes', { query })
    displayedQuotes.value = [...(response?.data || [])]
    hasMore.value = response?.pagination?.hasMore || false
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