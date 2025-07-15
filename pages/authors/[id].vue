<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="pending" class="animate-pulse">
      <div class="flex items-center space-x-6 mb-8">
        <div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div class="flex-1">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Author Content -->
    <div v-else-if="author" class="space-y-8">
      <!-- Author Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <!-- Avatar -->
          <UAvatar
            :src="author.image_url"
            :alt="author.name"
            size="2xl"
            :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
          />
          
          <!-- Info -->
          <div class="flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ author.name }}
                </h1>
                
                <div class="flex items-center space-x-3 mb-2">
                  <UBadge 
                    :color="author.is_fictional ? 'purple' : 'blue'" 
                    variant="subtle"
                  >
                    {{ author.is_fictional ? 'Fictional Character' : 'Real Person' }}
                  </UBadge>
                  
                  <span v-if="!author.is_fictional && (author.birth_date || author.death_date)" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatLifeDates(author.birth_date, author.death_date) }}
                  </span>
                </div>
                
                <p v-if="author.job" class="text-lg text-gray-600 dark:text-gray-400">
                  {{ author.job }}
                </p>
              </div>
              
              <!-- Like Button -->
              <button 
                @click="toggleLike" 
                :disabled="!user || likePending"
                :class="[
                  'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all',
                  isLiked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                  !user && 'cursor-not-allowed opacity-50'
                ]"
              >
                <UIcon 
                  :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" 
                  :class="['w-5 h-5', likePending && 'animate-pulse']"
                />
                <span class="font-medium">{{ author.likes_count }}</span>
              </button>
            </div>
            
            <!-- Description -->
            <p v-if="author.description" class="text-gray-600 dark:text-gray-400 mb-4">
              {{ author.description }}
            </p>
            
            <!-- Location -->
            <div v-if="author.birth_location || author.death_location" class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
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
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ authorQuotes.length }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Quotes</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatNumber(author.likes_count) }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Likes</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatNumber(author.views_count) }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Views</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatNumber(totalQuoteLikes) }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Quote Likes</div>
          </div>
        </div>
      </div>

      <!-- Social Links -->
      <div v-if="author.socials && author.socials.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
        <div class="flex flex-wrap gap-3">
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

      <!-- Quotes Section -->
      <div>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Quotes by {{ author.name }}
          </h2>
          
          <!-- Sort Options -->
          <USelectMenu
            v-model="sortBy"
            :options="sortOptions"
            @change="loadQuotes"
          />
        </div>

        <!-- Loading State -->
        <div v-if="quotesLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="i in 4" :key="i" class="animate-pulse">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        <!-- Quotes Grid -->
        <div v-else-if="authorQuotes.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuoteCard 
            v-for="quote in authorQuotes" 
            :key="quote.id" 
            :quote="quote"
            class="fade-in"
          />
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
        <div v-if="hasMoreQuotes && !quotesLoading" class="text-center mt-8">
          <UButton 
            variant="outline" 
            :loading="loadingMoreQuotes"
            @click="loadMoreQuotes"
          >
            Load More Quotes
          </UButton>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-16">
      <UIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Author Not Found</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        The author you're looking for doesn't exist or has been removed.
      </p>
      <UButton to="/authors">Browse Authors</UButton>
    </div>

    <!-- Submit Quote Modal -->
    <SubmitQuoteModal v-model="showSubmitModal" :prefill-author="author" />
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
const sortBy = ref('created_at')
const showSubmitModal = ref(false)

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
    const { data } = await $fetch('/api/quotes', {
      query: {
        author_id: author.value.id,
        page: currentQuotePage.value,
        limit: 12,
        sort_by: sortBy.value,
        sort_order: 'DESC'
      }
    })

    if (reset) {
      authorQuotes.value = data.data || []
    } else {
      authorQuotes.value.push(...(data.data || []))
    }

    hasMoreQuotes.value = data.pagination?.hasMore || false
  } catch (error) {
    console.error('Failed to load quotes:', error)
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
