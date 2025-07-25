<template>
  <div
    class="quote-flex-item group border relative cursor-pointer flex-shrink-0 transition-all duration-300
    hover:scale-102 active:scale-98 hover:shadow-xl hover:z-10"
    :class="[
      getFlexItemClasses(),
      getColorVariation(index),
      `opacity-${getOpacityLevel(index)}`
    ]"
    :style="getFlexItemStyle()"
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Background Pattern -->
    <div 
      class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
      :class="getPatternClass(index)"
    ></div>

    <!-- Content -->
    <div class="relative z-10 p-6 h-full flex flex-col">
      <!-- Quote Text -->
      <blockquote
        class="font-serif leading-relaxed flex-1 mb-4"
        :class="[
          getTextSizeClass(),
          getTextColorClass(index)
        ]"
      >
        "{{ quote.name }}"
      </blockquote>

      <!-- Attribution Footer -->
      <div 
        class="border-t b-dashed pt-3 mt-auto"
        :class="getBorderColorClass(index)"
      >
        <!-- Author -->
        <div v-if="quote.author" class="flex items-center space-x-2 mb-2">
          <UIcon name="i-ph-user" class="w-3 h-3 opacity-60" />
          <span 
            class="text-xs font-medium truncate"
            :class="getMetaTextColorClass(index)"
          >
            {{ quote.author.name }}
          </span>
        </div>

        <!-- Stats and Actions -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 text-xs opacity-60">
            <!-- Like Count -->
            <div class="flex items-center space-x-1">
              <UIcon name="i-ph-heart" class="w-3 h-3" />
              <span>{{ formatNumber(quote.likes_count) }}</span>
            </div>

            <!-- View Count -->
            <div class="flex items-center space-x-1">
              <UIcon name="i-ph-eye" class="w-3 h-3" />
              <span>{{ formatNumber(quote.views_count) }}</span>
            </div>
          </div>

          <!-- Like Button -->
          <button
            @click.stop="toggleQuoteLike"
            :disabled="!user || quoteLikePending"
            class="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-125"
            :class="isQuoteLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'"
          >
            <UIcon
              :name="isQuoteLiked ? 'i-ph-heart-fill' : 'i-ph-heart'"
              :class="['w-4 h-4', quoteLikePending && 'animate-pulse']"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Hover Glow Effect -->
    <div 
      class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
      :class="getGlowClass(index)"
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
  }
})

const { user } = useUserSession()
const isHovered = ref(false)
const isQuoteLiked = ref(false)
const quoteLikePending = ref(false)

// Get flexible sizing based on quote length and index
const getFlexItemClasses = () => {
  const length = props.quote.name.length
  const baseClasses = 'rounded-lg'
  
  if (length <= 50) {
    return `${baseClasses} w-64 h-48` // Small quotes
  } else if (length <= 150) {
    return `${baseClasses} w-80 h-56` // Medium quotes
  } else {
    return `${baseClasses} w-96 h-64` // Large quotes
  }
}

// Get dynamic styling
const getFlexItemStyle = () => {
  const variations = [
    { marginTop: '0px', marginBottom: '16px' },
    { marginTop: '8px', marginBottom: '8px' },
    { marginTop: '16px', marginBottom: '0px' },
    { marginTop: '12px', marginBottom: '12px' },
    { marginTop: '4px', marginBottom: '20px' }
  ]
  
  return variations[props.index % variations.length]
}

// Get color variations
const getColorVariation = (index) => {
  const variations = [
    'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50',
    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50',
    'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50',
    'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50',
    'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700/50'
  ]
  
  return variations[index % variations.length]
}

// Get text size based on quote length
const getTextSizeClass = () => {
  const length = props.quote.name.length
  
  if (length <= 50) {
    return 'text-lg font-500'
  } else if (length <= 100) {
    return 'text-base font-400'
  } else if (length <= 200) {
    return 'text-sm font-400'
  } else {
    return 'text-xs font-400'
  }
}

// Get text color variations
const getTextColorClass = (index) => {
  const colors = [
    'text-gray-800 dark:text-gray-200',
    'text-blue-900 dark:text-blue-100',
    'text-green-900 dark:text-green-100',
    'text-purple-900 dark:text-purple-100',
    'text-orange-900 dark:text-orange-100',
    'text-pink-900 dark:text-pink-100'
  ]
  
  return colors[index % colors.length]
}

// Get border color variations
const getBorderColorClass = (index) => {
  const colors = [
    'border-gray-200 dark:border-gray-700',
    'border-blue-200 dark:border-blue-700',
    'border-green-200 dark:border-green-700',
    'border-purple-200 dark:border-purple-700',
    'border-orange-200 dark:border-orange-700',
    'border-pink-200 dark:border-pink-700'
  ]
  
  return colors[index % colors.length]
}

// Get meta text color
const getMetaTextColorClass = (index) => {
  const colors = [
    'text-gray-600 dark:text-gray-400',
    'text-blue-700 dark:text-blue-300',
    'text-green-700 dark:text-green-300',
    'text-purple-700 dark:text-purple-300',
    'text-orange-700 dark:text-orange-300',
    'text-pink-700 dark:text-pink-300'
  ]
  
  return colors[index % colors.length]
}

// Get background pattern
const getPatternClass = (index) => {
  const patterns = [
    'bg-gradient-to-br from-gray-100 to-gray-200',
    'bg-gradient-to-br from-blue-100 to-blue-200',
    'bg-gradient-to-br from-green-100 to-green-200',
    'bg-gradient-to-br from-purple-100 to-purple-200',
    'bg-gradient-to-br from-orange-100 to-orange-200',
    'bg-gradient-to-br from-pink-100 to-pink-200'
  ]
  
  return patterns[index % patterns.length]
}

// Get glow effect
const getGlowClass = (index) => {
  const glows = [
    'bg-gray-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-orange-400',
    'bg-pink-400'
  ]
  
  return glows[index % glows.length]
}

// Get opacity level for visual variety
const getOpacityLevel = (index) => {
  const levels = [100, 95, 90, 85]
  return levels[index % levels.length]
}

// Navigate to quote detail
const navigateToQuote = () => {
  navigateTo(`/quote/${props.quote.id}`)
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
