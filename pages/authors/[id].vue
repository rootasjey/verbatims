<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="pending" class="p-8">
      <div class="animate-pulse">
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
      </div>
    </div>

    <!-- Author Content -->
    <div v-else-if="author">
      <!-- Author Header -->
      <header class="mt-12 p-8">
        <!-- Author Type -->
        <div class="flex items-center justify-center gap-4">
          <UBadge
            :color="author.is_fictional ? 'purple' : 'blue'"
            variant="subtle"
            size="sm"
          >
            {{ author.is_fictional ? 'Fictional Character' : 'Real Person' }}
          </UBadge>
        </div>

        <div class="text-center mb-6">
          <h1 class="font-title text-size-54 font-600 line-height-none uppercase mb-4">
            {{ author.name }}
          </h1>

          <span v-if="!author.is_fictional && (author.birth_date || author.death_date)" class="font-serif font-600 text-gray-600 dark:text-gray-400">
            {{ formatLifeDates(author.birth_date, author.death_date) }}
          </span>

          <!-- Job Title -->
          <p v-if="author.job" class="font-title text-lg text-gray-600 dark:text-gray-400 mb-4">
            {{ author.job }}
          </p>

          <!-- Description -->
          <p v-if="author.description" 
            class="font-body text-size-5 font-200 text-gray-600 
            dark:text-gray-400 max-w-2xl mx-auto mb-6
            border-t border-b border-dashed border-gray-300 dark:border-gray-600 p-6"
          >
            {{ author.description }}
          </p>

          <!-- Location Info -->
          <div v-if="author.birth_location || author.death_location" class="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div v-if="author.birth_location" class="flex items-center space-x-1">
              <UIcon name="i-ph-map-pin" class="w-4 h-4" />
              <span>Born in {{ author.birth_location }}</span>
            </div>
            <div v-if="author.death_location && author.death_location !== author.birth_location" class="flex items-center space-x-1">
              <UIcon name="i-ph-map-pin" class="w-4 h-4" />
              <span>Died in {{ author.death_location }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Social Links -->
      <div v-if="author.socials && author.socials.length > 0" class="px-8 mb-8">
        <div class="text-center">
          <h3 class="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton
              v-for="social in author.socials"
              :key="social.url"
              :to="social.url"
              external
              variant="outline"
              size="sm"
              :icon="getSocialIcon(social.platform)"
            >
              {{ social.platform }}
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
            <div class="flex items-center">{{ formatNumber(author.views_count) }} views</div>
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
              <span>{{ formatNumber(author.likes_count) }}</span>
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
          <div class="flex gap-4 max-w-2xl mx-auto items-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ authorQuotes.length }} quotes</p>
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
        <div v-else-if="authorQuotes.length > 0" class="mb-12">
          <!-- Masonry Grid Layout -->
          <MasonryGrid>
            <QuoteMasonryItem
              v-for="(quote, index) in authorQuotes"
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
            Be the first to submit a quote by {{ author.name }}!
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
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Author Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The author you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/authors" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse Authors
        </UButton>
      </div>
    </div>

    <!-- Submit Quote Modal -->
    <SubmitQuoteDialog v-model="showSubmitModal" :prefill-author="author" @submitted="refreshQuotes" />
  </div>
</template>

<script setup>
const route = useRoute()
const { user } = useUserSession()

// Fetch author data
const { data: authorData, pending } = await useFetch(`/api/authors/${route.params.id}`)
const author = computed(() => authorData.value?.data)

// SEO
useHead(() => ({
  title: author.value ? `${author.value.name} - Authors - Verbatims` : 'Author - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: author.value 
        ? `Discover quotes by ${author.value.name}. ${author.value.description || ''}`
        : 'View author details and quotes on Verbatims' 
    }
  ]
}))

// Quotes state
const authorQuotes = ref([])
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
  return authorQuotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
})

// Load quotes
const loadQuotes = async (reset = true) => {
  if (!author.value) return
  
  if (reset) {
    quotesLoading.value = true
    currentQuotePage.value = 1
    authorQuotes.value = []
  } else {
    loadingMoreQuotes.value = true
  }

  try {
    const response = await $fetch('/api/quotes', {
      query: {
        author_id: author.value.id,
        page: currentQuotePage.value,
        limit: 12,
        sort_by: sortBy.value,
        sort_order: 'DESC'
      }
    })

    if (reset) {
      authorQuotes.value = response.data || []
    } else {
      authorQuotes.value.push(...(response.data || []))
    }

    hasMoreQuotes.value = response.pagination?.hasMore || false
  } catch (error) {
    console.error('Failed to load quotes:', error)
    // Reset quotes on error to show empty state
    if (reset) {
      authorQuotes.value = []
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

// Like functionality
const checkLikeStatus = async () => {
  if (!user.value || !author.value) return
  
  try {
    const { data } = await $fetch(`/api/authors/${author.value.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !author.value || likePending.value) return
  
  likePending.value = true
  try {
    const { data } = await $fetch(`/api/authors/${author.value.id}/like`, {
      method: 'POST'
    })
    
    isLiked.value = data.isLiked
    author.value.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

// Utility functions
const formatLifeDates = (birthDate, deathDate) => {
  if (!birthDate && !deathDate) return ''
  
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : 'present'
  
  return `${birth} - ${death}`
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

const getSocialIcon = (platform) => {
  const icons = {
    twitter: 'i-simple-icons-twitter',
    facebook: 'i-simple-icons-facebook',
    instagram: 'i-simple-icons-instagram',
    linkedin: 'i-simple-icons-linkedin',
    youtube: 'i-simple-icons-youtube',
    website: 'i-ph-globe'
  }
  return icons[platform.toLowerCase()] || 'i-ph-link'
}

const openSubmitModal = () => {
  showSubmitModal.value = true
}

// Refresh quotes after submission
const refreshQuotes = async () => {
  await loadQuotes()
}

// Load data on mount
onMounted(() => {
  if (author.value) {
    loadQuotes()
    if (user.value) {
      checkLikeStatus()
    }
  }
})

// Watch for changes
watch(author, (newAuthor) => {
  if (newAuthor) {
    loadQuotes()
    if (user.value) {
      checkLikeStatus()
    }
  }
})

watch(user, (newUser) => {
  if (newUser && author.value) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})

watch(sortBy, () => {
  loadQuotes()
})
</script>


