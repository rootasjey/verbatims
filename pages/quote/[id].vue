<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="pending" class="px-8 py-16">
      <div class="max-w-4xl mx-auto">
        <div class="animate-pulse space-y-8">
          <div class="text-center space-y-4">
            <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          </div>
          <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Quote Content -->
    <div v-else-if="quote" class="mt-24 px-8 py-16">
      <div class="max-w-4xl mx-auto">
        <!-- Main Quote Section -->
        <div class="text-center mb-16">
          <!-- Quote Text - Typography Focused -->
          <div class="relative mb-12">
            <blockquote class="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight text-gray-900 dark:text-white mb-8 px-4">
              {{ quote.name }}
            </blockquote>

            <!-- Decorative Elements -->
            <div class="absolute -top-4 -left-4 text-6xl text-gray-200 dark:text-gray-700 font-serif">"</div>
            <div class="absolute -bottom-4 -right-4 text-6xl text-gray-200 dark:text-gray-700 font-serif">"</div>
          </div>

          <!-- Attribution Section -->
          <div class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8 space-y-2">
            <!-- Author -->
            <div v-if="quote.author" class="flex flex-col items-center justify-center">
              <NuxtLink :to="`/authors/${quote.author.id}`">
                <UAvatar
                  :src="quote.author.image_url"
                  :alt="quote.author.name"
                  size="xl"
                  class="ring-2 ring-gray-200 dark:ring-gray-700 hover:scale-105 active:scale-99 transition-transform"
                />
              </NuxtLink>
              <div class="text-left">
                <NuxtLink
                  :to="`/authors/${quote.author.id}`"
                  class="font-body text-size-4  font-400 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
                >
                  {{ quote.author.name }}
                </NuxtLink>
                <p v-if="quote.author.is_fictional" class="text-sm text-gray-500 dark:text-gray-400 font-sans">
                  Fictional Character
                </p>
              </div>
            </div>

            <!-- Reference -->
            <div v-if="quote.reference" class="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400">
              <UIcon :name="getReferenceIcon(quote.reference.type)" />
              <NuxtLink
                :to="`/references/${quote.reference.id}`"
                class="font-serif font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors underline decoration-dashed decoration-offset-4"
              >
                {{ quote.reference.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="quote.tags?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8">
          <div class="flex flex-wrap justify-center gap-3">
            <NuxtLink
              v-for="tag in quote.tags"
              :key="tag.name"
              :to="`/tags/${encodeURIComponent(tag.name)}`"
              class="inline-flex items-center px-4 py-2 border border-dashed rounded-lg text-sm font-medium font-sans transition-all hover:scale-105 hover:shadow-sm"
              :style="{
                backgroundColor: tag.color + '10',
                color: tag.color,
                borderColor: tag.color + '40'
              }"
            >
              #{{ tag.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8">
          <div class="flex items-center justify-center space-x-12">
            <!-- Like -->
            <button
              @click="toggleLike"
              :disabled="!user || likePending"
              :class="[
                'flex flex-col items-center space-y-2 px-6 py-4 rounded-lg transition-all group',
                isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                !user && 'cursor-not-allowed opacity-50'
              ]"
            >
              <UIcon
                :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'"
                :class="['w-6 h-6 transition-transform group-hover:scale-110', likePending && 'animate-pulse']"
              />
              <div class="text-center">
                <div class="font-semibold">{{ quote.likes_count }}</div>
                <div class="text-xs font-sans">{{ quote.likes_count === 1 ? 'Like' : 'Likes' }}</div>
              </div>
            </button>

            <!-- Share -->
            <button
              @click="shareQuote"
              :disabled="sharePending"
              class="flex flex-col items-center space-y-2 px-6 py-4 rounded-lg text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
            >
              <UIcon
                name="i-ph-share"
                :class="['w-6 h-6 transition-transform group-hover:scale-110', sharePending && 'animate-pulse']"
              />
              <div class="text-center">
                <div class="font-semibold">{{ quote.shares_count }}</div>
                <div class="text-xs font-sans">Share</div>
              </div>
            </button>

            <!-- Views -->
            <div class="flex flex-col items-center space-y-2 px-6 py-4 text-gray-500">
              <UIcon name="i-ph-eye" class="w-6 h-6" />
              <div class="text-center">
                <div class="font-semibold">{{ formatNumber(quote.views_count) }}</div>
                <div class="text-xs font-sans">{{ quote.views_count === 1 ? 'View' : 'Views' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quote Details & Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-dashed border-gray-300 dark:border-gray-600 pt-16">
        <!-- Metadata -->
        <div class="lg:col-span-2">
          <div class="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <h3 class="text-xl font-serif font-semibold text-gray-900 dark:text-white mb-6">Quote Details</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <dt class="text-sm font-sans font-medium text-gray-500 dark:text-gray-400 mb-1">Language</dt>
                <dd class="text-base font-serif text-gray-900 dark:text-white">
                  {{ getLanguageName(quote.language) }}
                </dd>
              </div>

              <div>
                <dt class="text-sm font-sans font-medium text-gray-500 dark:text-gray-400 mb-1">Submitted by</dt>
                <dd class="text-base font-serif text-gray-900 dark:text-white">
                  {{ quote.user.name }}
                </dd>
              </div>

              <div>
                <dt class="text-sm font-sans font-medium text-gray-500 dark:text-gray-400 mb-1">Added on</dt>
                <dd class="text-base font-serif text-gray-900 dark:text-white">
                  {{ formatDate(quote.created_at) }}
                </dd>
              </div>

              <div v-if="quote.is_featured">
                <dt class="text-sm font-sans font-medium text-gray-500 dark:text-gray-400 mb-1">Status</dt>
                <dd>
                  <UBadge color="yellow" variant="subtle" class="font-sans">
                    <UIcon name="i-ph-star" class="w-3 h-3 mr-1" />
                    Featured Quote
                  </UBadge>
                </dd>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="lg:col-span-1">
          <div class="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <h3 class="text-xl font-serif font-semibold text-gray-900 dark:text-white mb-6">Actions</h3>

            <div class="space-y-3">
              <UButton
                v-if="user"
                block
                variant="outline"
                icon
                label="i-ph-bookmark"
                @click="addToCollection"
                class="font-sans justify-start"
              >
                Add to Collection
              </UButton>

              <UButton
                block
                variant="outline"
                icon
                label="i-ph-download"
                @click="downloadQuote"
                class="font-sans justify-start"
              >
                Download Image
              </UButton>

              <UButton
                block
                variant="outline"
                icon
                label="i-ph-flag"
                @click="reportQuote"
                class="font-sans justify-start"
              >
                Report Quote
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Quotes -->
      <div v-if="relatedQuotes?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-16">
        <h3 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white text-center mb-12">Related Quotes</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div
            v-for="relatedQuote in relatedQuotes"
            :key="relatedQuote.id"
            class="border border-dashed border-gray-300 dark:border-gray-600 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group"
            @click="navigateTo(`/quote/${relatedQuote.id}`)"
          >
            <blockquote class="font-serif text-lg text-gray-800 dark:text-gray-200 mb-4 line-clamp-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              "{{ relatedQuote.name }}"
            </blockquote>
            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span v-if="relatedQuote.author" class="font-sans">{{ relatedQuote.author.name }}</span>
              <div class="flex items-center space-x-4">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-ph-heart" class="w-4 h-4" />
                  <span>{{ relatedQuote.likes_count }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <UIcon name="i-ph-eye" class="w-4 h-4" />
                  <span>{{ formatNumber(relatedQuote.views_count) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="px-8 py-16">
      <div class="max-w-4xl mx-auto text-center">
        <UIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white mb-4">Quote Not Found</h2>
        <p class="text-lg font-sans text-gray-600 dark:text-gray-400 mb-8">
          The quote you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/" size="lg" class="font-sans">Browse Quotes</UButton>
      </div>
    </div>
  </div>

  <!-- Add to Collection Modal -->
  <AddToCollectionModal
    v-model="showAddToCollectionModal"
    :quote="quote"
    @added="onAddedToCollection"
  />
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

// Share functionality
const sharePending = ref(false)

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
  if (!quote.value || sharePending.value) return

  sharePending.value = true
  const { toast } = useToast()

  try {
    const shareData = {
      title: 'Quote from Verbatims',
      text: `"${quote.value.name}" ${quote.value.author ? `- ${quote.value.author.name}` : ''}`,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
      toast({
        title: 'Quote shared successfully!',
        variant: 'success'
      })
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      toast({
        title: 'Quote link copied to clipboard!',
        variant: 'success'
      })
    }

    // Track share
    await $fetch(`/api/quotes/${route.params.id}/share`, { method: 'POST' })
    quote.value.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
    toast({
      title: 'Failed to share quote',
      description: 'Please try again.',
      variant: 'error'
    })
  } finally {
    sharePending.value = false
  }
}

// Other actions
const showAddToCollectionModal = ref(false)

const addToCollection = () => {
  showAddToCollectionModal.value = true
}

// Handle quote added to collection
const onAddedToCollection = (collection) => {
  const { toast } = useToast()
  toast({
    title: 'Quote added to collection!',
    description: `Added to "${collection.name}" collection.`,
    variant: 'success'
  })
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
    other: 'i-solar-document-broken'
  }
  return icons[type] || 'i-solar-document-broken'
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
