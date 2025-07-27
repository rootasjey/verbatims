<template>
  <div class="min-h-screen">
    <!-- Loading State for Language Store -->
    <div v-if="!isLanguageReady" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>

    <!-- Loading State for Reference Data -->
    <div v-else-if="pending" class="p-8">
      <div class="animate-pulse">
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
      </div>
    </div>

    <!-- Reference Content -->
    <div v-else-if="reference">
      <!-- Reference Header -->
      <header class="mt-12 p-8">
        <!-- Reference Type and Release Date -->
        <div class="flex items-center justify-center gap-4">
          <UBadge
            :color="getTypeColor(reference.primary_type)"
            variant="subtle"
            size="sm"
          >
            {{ formatType(reference.primary_type) }}
          </UBadge>

          <span v-if="reference.release_date" class="font-serif text-gray-600 dark:text-gray-400">
            {{ formatReleaseDate(reference.release_date) }}
          </span>
        </div>

        <div class="text-center mb-6">

          <!-- Reference Name -->
          <h1 class="font-title text-size-54 font-600 line-height-none uppercase mb-4">
            {{ reference.name }}
          </h1>

          <!-- Secondary Type -->
          <p v-if="reference.secondary_type" class="font-title text-lg text-gray-600 dark:text-gray-400 mb-4">
            {{ reference.secondary_type }}
          </p>

          <!-- Description -->
          <p v-if="reference.description"
            class="font-body text-size-5 font-200 text-gray-600
            dark:text-gray-400 max-w-2xl mx-auto mb-6
            border-t border-b border-dashed border-gray-300 dark:border-gray-600 p-6"
          >
            {{ reference.description }}
          </p>

          <!-- Language Info -->
          <div v-if="reference.original_language && reference.original_language !== 'en'" class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <UIcon name="i-ph-globe" class="w-4 h-4" />
            <span>Original Language: {{ formatLanguage(reference.original_language) }}</span>
          </div>


        </div>


      </header>

      <!-- External Links -->
      <div v-if="reference.urls && reference.urls.length > 0" class="px-8 mb-8">
        <div class="text-center">
          <h3 class="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-4">External Links</h3>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton
              v-for="(url, index) in reference.urls"
              :key="index"
              :to="url"
              external
              variant="outline"
              size="sm"
              icon="i-ph-link"
            >
              View Source
            </UButton>
          </div>
        </div>
      </div>

      <UBadge :badge="isMetaBadgeOpen ? 'solid-gray' : 'soft'" rounded="full"
        :class="[
          'z-2 fixed top-20 right-12 overflow-hidden text-sm font-medium transition-all',
          isMetaBadgeOpen ? 'w-auto px-4 text-center hover:scale-101 active:scale-99' : 'w-9 hover:scale-105 active:scale-99'
        ]">
        <div class="flex gap-4 justify-center items-center">
          <div :class="['gap-4', isMetaBadgeOpen ? 'flex' : 'hidden']">
            <div class="flex items-center">{{ referenceQuotes.length }} quotes</div>
            <div class="flex items-center">{{ formatNumber(reference.views_count) }} views</div>
            <div class="flex items-center">{{ formatNumber(totalQuoteLikes) }} quote likes</div>
            <UButton
              btn="~"
              @click="toggleLike"
              :disabled="!user || likePending"
              :class="[
                'min-w-0 min-h-0 h-auto w-auto p-0 flex items-center transition-all',
                isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                !user && 'cursor-not-allowed opacity-50'
              ]"
            >
              <UIcon
                :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-hand-heart-duotone'"
                :class="[likePending && 'animate-pulse']"
              />
              <span>{{ formatNumber(reference.likes_count) }}</span>
            </UButton>
          </div>
          <UButton
            icon btn="text-pink"
            :label="isMetaBadgeOpen ? 'i-ph-x-bold' : 'i-ph-asterisk-bold'"
            :class="['min-w-0 min-h-0 h-auto w-auto p-0', isMetaBadgeOpen ? 'hover:animate-pulse' : 'hover:animate-spin']" size="xs"
            @click="isMetaBadgeOpen = !isMetaBadgeOpen"
          />
        </div>
      </UBadge>

      <!-- Quotes Section -->
      <div class="px-8 pb-16">
        <!-- Sort Options -->
        <div class="font-body mb-8">
          <div class="flex gap-4 max-w-2xl mx-auto items-center justify-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ referenceQuotes.length }} quotes</p>
            <span class="whitespace-nowrap font-600 text-gray-600 dark:text-gray-500">
              sorted by
            </span>
            <USelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Sort by"
              item-key="label"
              value-key="label"
              @change="loadQuotes"
            />
          </div>

          <!-- Language Selector -->
          <div class="flex items-center justify-center mt-4">
            <LanguageSelector @language-changed="onLanguageChange" />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="quotesLoading" class="mb-12">
          <MasonryGrid>
            <div v-for="i in 12" :key="i" class="quote-skeleton animate-pulse">
              <div class="border-b border-dashed border-gray-200 dark:border-gray-400 pb-2 mb-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
          </MasonryGrid>
        </div>

        <!-- Quotes Display -->
        <div v-else-if="referenceQuotes.length > 0" class="mb-12">
          <!-- Masonry Grid Layout -->
          <MasonryGrid>
            <QuoteMasonryItem
              v-for="(quote, index) in referenceQuotes"
              :key="quote.id"
              :quote="quote"
              :index="index"
              class="fade-in"
            />
          </MasonryGrid>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <UIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Be the first to submit a quote from {{ reference.name }}!
          </p>
          <UButton @click="openSubmitModal">Submit Quote</UButton>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreQuotes && !quotesLoading" class="text-center">
          <UButton
            @click="loadMoreQuotes"
            :loading="loadingMoreQuotes"
            :disabled="loadingMoreQuotes"
            size="sm"
            btn="solid-black"
            class="px-8 py-6 w-full rounded-3 hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
          >
            {{ loadingMoreQuotes ? 'Loading...' : 'Load More Quotes' }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="p-8">
      <div class="text-center py-16">
        <UIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Reference Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The reference you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/references" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse References
        </UButton>
      </div>
    </div>

    <!-- Submit Quote Modal -->
    <SubmitQuoteDialog v-model="showSubmitModal" :prefill-reference="reference" @submitted="refreshQuotes" />
  </div>
</template>

<script setup>
const route = useRoute()
const { user } = useUserSession()

// Language store (initialization handled by plugin)
const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()

// Fetch reference data
const { data: referenceData, pending } = await useLazyFetch(`/api/references/${route.params.id}`)
const reference = computed(() => referenceData.value?.data)

// SEO
useHead(() => ({
  title: reference.value ? `${reference.value.name} - References - Verbatims` : 'Reference - Verbatims',
  meta: [
    {
      name: 'description',
      content: reference.value
        ? `Discover quotes from ${reference.value.name}. ${reference.value.description || ''}`
        : 'View reference details and quotes on Verbatims'
    }
  ]
}))

// Quotes state
const referenceQuotes = ref([])
const quotesLoading = ref(false)
const loadingMoreQuotes = ref(false)
const hasMoreQuotes = ref(true)
const currentQuotePage = ref(1)
const sortBy = ref({ label: 'Most Recent', value: 'created_at' })
const showSubmitModal = ref(false)

const isMetaBadgeOpen = ref(false)

// Sort options
const sortOptions = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Most Popular', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' }
]

// Like functionality
const isLiked = ref(false)
const likePending = ref(false)

// Computed
const totalQuoteLikes = computed(() => {
  return referenceQuotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
})

// Load quotes
const loadQuotes = async (reset = true) => {
  if (!reference.value) return

  // Wait for language store to be ready before loading quotes
  await waitForLanguageStore()

  if (reset) {
    quotesLoading.value = true
    currentQuotePage.value = 1
    referenceQuotes.value = []
  } else {
    loadingMoreQuotes.value = true
  }

  try {
    const query = {
      reference_id: reference.value.id,
      page: currentQuotePage.value,
      limit: 12,
      sort_by: sortBy.value.value || sortBy.value,
      sort_order: 'DESC',
      ...languageStore.getLanguageQuery()
    }

    const response = await $fetch('/api/quotes', { query })

    if (reset) {
      referenceQuotes.value = response.data || []
    } else {
      referenceQuotes.value.push(...(response.data || []))
    }

    hasMoreQuotes.value = response.pagination?.hasMore || false
  } catch (error) {
    console.error('Failed to load quotes:', error)
    // Reset quotes on error to show empty state
    if (reset) {
      referenceQuotes.value = []
    }
    hasMoreQuotes.value = false
  } finally {
    quotesLoading.value = false
    loadingMoreQuotes.value = false
  }
}

// Load more quotes
const loadMoreQuotes = async () => {
  if (loadingMoreQuotes.value || !hasMoreQuotes.value) return

  currentQuotePage.value++
  await loadQuotes(false)
}

// Language change handler
const onLanguageChange = async () => {
  // Reset pagination when language changes
  currentQuotePage.value = 1
  hasMoreQuotes.value = true

  // Reload quotes with new language filter
  await loadQuotes(true)
}

// Like functionality (placeholder - would need API endpoint)
const checkLikeStatus = async () => {
  if (!user.value || !reference.value) return

  try {
    // TODO: Implement reference like status check
    // const { data } = await $fetch(`/api/references/${reference.value.id}/like-status`)
    // isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !reference.value || likePending.value) return

  likePending.value = true
  try {
    // TODO: Implement reference like toggle
    // const { data } = await $fetch(`/api/references/${reference.value.id}/like`, {
    //   method: 'POST'
    // })
    // isLiked.value = data.isLiked
    // reference.value.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

// Utility functions
const formatReleaseDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.getFullYear()
}

const formatLanguage = (langCode) => {
  const languages = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'zh': 'Chinese'
  }
  return languages[langCode] || langCode.toUpperCase()
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getTypeColor = (type) => {
  const colors = {
    'film': 'red',
    'book': 'blue',
    'tv_series': 'purple',
    'music': 'green',
    'speech': 'orange',
    'podcast': 'pink',
    'interview': 'yellow',
    'documentary': 'indigo',
    'media_stream': 'cyan',
    'writings': 'gray',
    'video_game': 'lime',
    'other': 'slate'
  }
  return colors[type] || 'gray'
}

const formatType = (type) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const openSubmitModal = () => {
  showSubmitModal.value = true
}

// Refresh quotes after submission
const refreshQuotes = async () => {
  await loadQuotes()
}

// Load data on mount
onMounted(async () => {
  // Wait for language store to be ready
  await waitForLanguageStore()

  if (reference.value) {
    loadQuotes()
    if (user.value) {
      checkLikeStatus()
    }
  }
})

// Watch for changes
watch(reference, (newReference) => {
  if (newReference) {
    loadQuotes()
    if (user.value) {
      checkLikeStatus()
    }
  }
})

watch(user, (newUser) => {
  if (newUser && reference.value) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})

watch(sortBy, () => {
  loadQuotes()
})
</script>
