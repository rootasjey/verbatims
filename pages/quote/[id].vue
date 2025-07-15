<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="pending" class="animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
      <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
    </div>

    <!-- Quote Content -->
    <div v-else-if="quote" class="space-y-8">
      <!-- Main Quote -->
      <div class="text-center">
        <blockquote class="text-2xl sm:text-3xl lg:text-4xl font-medium leading-relaxed text-gray-900 dark:text-white mb-8">
          "{{ quote.name }}"
        </blockquote>
        
        <!-- Attribution -->
        <div class="space-y-4">
          <div v-if="quote.author" class="flex items-center justify-center space-x-4">
            <UAvatar 
              :src="quote.author.image_url" 
              :alt="quote.author.name" 
              size="lg"
            />
            <div class="text-left">
              <NuxtLink 
                :to="`/authors/${quote.author.id}`"
                class="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {{ quote.author.name }}
              </NuxtLink>
              <p v-if="quote.author.is_fictional" class="text-sm text-gray-500 dark:text-gray-400">
                Fictional Character
              </p>
            </div>
          </div>
          
          <div v-if="quote.reference" class="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
            <UIcon :name="getReferenceIcon(quote.reference.type)" class="w-5 h-5" />
            <span>From:</span>
            <NuxtLink 
              :to="`/references/${quote.reference.id}`"
              class="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {{ quote.reference.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="quote.tags?.length" class="flex flex-wrap justify-center gap-3">
        <NuxtLink
          v-for="tag in quote.tags" 
          :key="tag.name"
          :to="`/tags/${encodeURIComponent(tag.name)}`"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105"
          :style="{ 
            backgroundColor: tag.color + '20', 
            color: tag.color,
            borderColor: tag.color + '40'
          }"
        >
          #{{ tag.name }}
        </NuxtLink>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-center space-x-8 py-6 border-y border-gray-200 dark:border-gray-700">
        <!-- Like -->
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
          <span class="font-medium">{{ quote.likes_count }}</span>
          <span class="hidden sm:inline">{{ quote.likes_count === 1 ? 'Like' : 'Likes' }}</span>
        </button>
        
        <!-- Share -->
        <button 
          @click="shareQuote"
          class="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
        >
          <UIcon name="i-ph-share" class="w-5 h-5" />
          <span class="font-medium">{{ quote.shares_count }}</span>
          <span class="hidden sm:inline">Share</span>
        </button>
        
        <!-- Views -->
        <div class="flex items-center space-x-2 px-4 py-2 text-gray-500">
          <UIcon name="i-ph-eye" class="w-5 h-5" />
          <span class="font-medium">{{ formatNumber(quote.views_count) }}</span>
          <span class="hidden sm:inline">{{ quote.views_count === 1 ? 'View' : 'Views' }}</span>
        </div>
      </div>

      <!-- Quote Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Metadata -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Quote Details</h3>
          </template>
          
          <div class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Language</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ getLanguageName(quote.language) }}
              </dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted by</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ quote.user.name }}
              </dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Added on</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ formatDate(quote.created_at) }}
              </dd>
            </div>
            
            <div v-if="quote.is_featured">
              <UBadge color="yellow" variant="subtle">
                <UIcon name="i-ph-star" class="w-3 h-3 mr-1" />
                Featured Quote
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Actions Card -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Actions</h3>
          </template>
          
          <div class="space-y-3">
            <UButton 
              v-if="user"
              block
              variant="outline"
              icon="i-ph-bookmark"
              @click="addToCollection"
            >
              Add to Collection
            </UButton>
            
            <UButton 
              block
              variant="outline"
              icon="i-ph-download"
              @click="downloadQuote"
            >
              Download Image
            </UButton>
            
            <UButton 
              block
              variant="outline"
              icon="i-ph-flag"
              @click="reportQuote"
            >
              Report Quote
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Related Quotes -->
      <div v-if="relatedQuotes?.length">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Quotes</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuoteCard 
            v-for="relatedQuote in relatedQuotes" 
            :key="relatedQuote.id" 
            :quote="relatedQuote" 
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-16">
      <UIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quote Not Found</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        The quote you're looking for doesn't exist or has been removed.
      </p>
      <UButton to="/">Browse Quotes</UButton>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { user } = useUserSession()

// Fetch quote data
const { data: quoteData, pending } = await useFetch(`/api/quotes/${route.params.id}`)
const quote = computed(() => quoteData.value?.data)

// Fetch related quotes
const { data: relatedData } = await useFetch(`/api/quotes/${route.params.id}/related`)
const relatedQuotes = computed(() => relatedData.value?.data || [])

// SEO
useHead(() => ({
  title: quote.value ? `"${quote.value.name.substring(0, 60)}..." - Verbatims` : 'Quote - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: quote.value ? `${quote.value.name.substring(0, 160)}...` : 'View quote details on Verbatims' 
    },
    { property: 'og:title', content: quote.value ? `"${quote.value.name}"` : 'Quote' },
    { property: 'og:description', content: quote.value ? `${quote.value.author?.name ? `- ${quote.value.author.name}` : ''}` : '' },
    { property: 'og:type', content: 'article' }
  ]
}))

// Track view
onMounted(async () => {
  if (quote.value) {
    try {
      await $fetch(`/api/quotes/${route.params.id}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }
})

// Like functionality
const isLiked = ref(false)
const likePending = ref(false)

const checkLikeStatus = async () => {
  if (!user.value || !quote.value) return
  
  try {
    const { data } = await $fetch(`/api/quotes/${route.params.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !quote.value || likePending.value) return
  
  likePending.value = true
  try {
    const { data } = await $fetch(`/api/quotes/${route.params.id}/like`, {
      method: 'POST'
    })
    
    isLiked.value = data.isLiked
    quote.value.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

// Share functionality
const shareQuote = async () => {
  if (!quote.value) return
  
  try {
    const shareData = {
      title: 'Quote from Verbatims',
      text: `"${quote.value.name}" ${quote.value.author ? `- ${quote.value.author.name}` : ''}`,
      url: window.location.href
    }
    
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      // TODO: Show toast notification
    }
    
    // Track share
    await $fetch(`/api/quotes/${route.params.id}/share`, { method: 'POST' })
    quote.value.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
  }
}

// Other actions
const addToCollection = () => {
  // TODO: Open collection modal
}

const downloadQuote = () => {
  // TODO: Generate and download quote image
}

const reportQuote = () => {
  // TODO: Open report modal
}

// Utility functions
const getReferenceIcon = (type) => {
  const icons = {
    film: 'i-ph-film-strip',
    book: 'i-ph-book',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video',
    other: 'i-ph-file'
  }
  return icons[type] || 'i-ph-file'
}

const getLanguageName = (code) => {
  const languages = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese'
  }
  return languages[code] || code.toUpperCase()
}

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Check like status on mount
onMounted(() => {
  if (user.value && quote.value) {
    checkLikeStatus()
  }
})

// Watch for user changes
watch(user, (newUser) => {
  if (newUser && quote.value) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})
</script>
