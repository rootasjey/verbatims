<template>
  <div
    class="quote-list-item group border-b b-dashed b-gray-200 dark:border-gray-400 relative p-6 cursor-pointer
    hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-300"
    :class="[
      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30',
      `opacity-${getOpacityLevel(index)}`
    ]"
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="flex items-start space-x-6">
      <!-- Quote Number/Index -->
      <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span class="font-mono text-sm font-600 text-gray-600 dark:text-gray-400">
          {{ String(index + 1).padStart(2, '0') }}
        </span>
      </div>

      <!-- Quote Content -->
      <div class="flex-1 min-w-0">
        <!-- Quote Text -->
        <blockquote
          class="font-serif text-gray-800 dark:text-gray-200 leading-relaxed mb-3"
          :class="{
            'text-lg': quote.name.length <= 100,
            'text-base': quote.name.length > 100 && quote.name.length <= 200,
            'text-sm': quote.name.length > 200
          }"
        >
          "{{ quote.name }}"
        </blockquote>

        <!-- Attribution and Meta -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <!-- Author -->
            <div v-if="quote.author" class="flex items-center space-x-2">
              <UIcon name="i-ph-user" class="w-4 h-4" />
              <span class="font-medium">{{ quote.author.name }}</span>
            </div>

            <!-- Reference (if different from current page) -->
            <div v-if="quote.reference && showReference" class="flex items-center space-x-2">
              <UIcon name="i-ph-book-open-text" class="w-4 h-4" />
              <span>{{ quote.reference.name }}</span>
            </div>

            <!-- Date -->
            <div class="flex items-center space-x-2">
              <UIcon name="i-ph-calendar" class="w-4 h-4" />
              <span>{{ formatDate(quote.created_at) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <!-- Like Button -->
            <button
              @click.stop="toggleQuoteLike"
              :disabled="!user || quoteLikePending"
              class="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              <UIcon
                :name="isQuoteLiked ? 'i-ph-heart-fill' : 'i-ph-heart'"
                :class="['w-4 h-4', quoteLikePending && 'animate-pulse']"
              />
              <span class="text-xs">{{ formatNumber(quote.likes_count) }}</span>
            </button>

            <!-- View Count -->
            <div class="flex items-center space-x-1 text-gray-500">
              <UIcon name="i-ph-eye" class="w-4 h-4" />
              <span class="text-xs">{{ formatNumber(quote.views_count) }}</span>
            </div>

            <!-- More Actions -->
            <button
              @click.stop="openQuoteActions"
              class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <UIcon name="i-ph-dots-three" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hover Effect Indicator -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
    ></div>
  </div>
</template>

<script setup>
const props = defineProps({
  quote: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  showReference: {
    type: Boolean,
    default: false
  }
})

const { user } = useUserSession()
const isHovered = ref(false)
const isQuoteLiked = ref(false)
const quoteLikePending = ref(false)

// Get opacity level based on index for visual variety
const getOpacityLevel = (index) => {
  const levels = [100, 90, 80]
  return levels[index % levels.length]
}

// Navigate to quote detail
const navigateToQuote = () => {
  navigateTo(`/quote/${props.quote.id}`)
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Format numbers
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Quote like functionality
const toggleQuoteLike = async () => {
  if (!user.value || quoteLikePending.value) return
  
  quoteLikePending.value = true
  try {
    const { data } = await $fetch(`/api/quotes/${props.quote.id}/like`, {
      method: 'POST'
    })
    
    isQuoteLiked.value = data.isLiked
    props.quote.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle quote like:', error)
  } finally {
    quoteLikePending.value = false
  }
}

// Open quote actions (placeholder)
const openQuoteActions = () => {
  // TODO: Implement quote actions menu
  console.log('Quote actions for:', props.quote.id)
}

// Check like status on mount
onMounted(async () => {
  if (user.value) {
    try {
      const { data } = await $fetch(`/api/quotes/${props.quote.id}/like-status`)
      isQuoteLiked.value = data?.isLiked || false
    } catch (error) {
      console.error('Failed to check quote like status:', error)
    }
  }
})
</script>
