<template>
  <div
    class="quote-masonry-item group border b-dashed border-gray-300 dark:border-gray-600 
    relative rounded-2 cursor-pointer transition-all duration-300 ease-in-out
    hover:shadow-lg hover:b-solid hover:border-gray-400 dark:hover:border-blue-500
    bg-white dark:bg-[#101010]"
    :class="[
      getMasonryItemClasses(),
      `opacity-${getOpacityLevel(index)}`
    ]"
    :style="getMasonryItemStyle()"
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Content Container -->
    <div class="w-80% mx-auto px-6 h-full flex flex-col justify-center items-center">
      <!-- Attribution -->
      <div class="flex justify-between items-center w-full mb-4">
        <!-- Reference Info (if exists) -->
        <div v-if="quote.reference" class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
          <div class="w-6 h-0.5 bg-black dark:bg-gray-300 rounded-2" /> {{ quote.reference.name }}
        </div>
      </div>

      <!-- Attribution -->
      <div 
        class="absolute bottom-4 right-4 flex border-gray-200 dark:border-gray-400 pt-3 mt-auto
        opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
      >
        <!-- Stats and Actions -->
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center space-x-3">
            <!-- Like Button -->
            <UButton
              icon
              btn="~"
              @click.stop="toggleQuoteLike"
              :disabled="!user || quoteLikePending"
              class="p-0 min-w-0 min-h-0 h-auto w-auto transition-all duration-300 hover:scale-105"
              :class="isQuoteLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'"
            >
              <UIcon
                :name="isQuoteLiked ? 'i-ph-heart-fill' : 'i-ph-hand-heart-duotone'"
                :class="[quoteLikePending && 'animate-pulse']"
              />
              <span>{{ formatNumber(quote.likes_count) }}</span>
            </UButton>

            <!-- View Count -->
            <div class="flex items-center space-x-1 text-size-4">
              <UIcon name="i-ph-eyes" />
              <span>{{ formatNumber(quote.views_count) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quote Text (Main Content) -->
      <blockquote
        class="font-serif leading-relaxed mb-4 text-gray-800 dark:text-gray-200"
        :class="getTextSizeClass()"
      >
        {{ quote.name }}
      </blockquote>
    </div>

    <!-- Featured Badge -->
    <UBadge
      v-if="quote.is_featured"
      color="yellow"
      variant="subtle"
      size="xs"
      class="absolute top-2 right-2"
    >
      Featured
    </UBadge>

    <!-- Hover Glow Effect -->
    <div 
      class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 
      pointer-events-none bg-gradient-to-br from-primary-500/20 to-transparent"
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

// Get masonry item classes based on quote length and index for irregular sizing
const getMasonryItemClasses = () => {
  const length = props.quote.name.length
  const index = props.index
  
  // Create irregular grid patterns based on content length and position
  if (length <= 80) {
    // Short quotes - smaller cards
    return index % 7 === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-2'
  }
  
  if (length <= 150) {
    // Medium quotes - varied sizing
    if (index % 5 === 0) return 'col-span-2 row-span-2'
    if (index % 3 === 0) return 'col-span-1 row-span-2'
    return 'col-span-1 row-span-2'
  }
  
  if (length <= 250) {
    // Long quotes - larger cards
    if (index % 4 === 0) return 'col-span-2 row-span-3'
    if (index % 6 === 0) return 'col-span-1 row-span-3'
    return 'col-span-1 row-span-2'
  }

  // Very long quotes - largest cards
  if (index % 3 === 0) return 'col-span-2 row-span-4'
  return 'col-span-1 row-span-3'
}

// Get dynamic styling for masonry items
const getMasonryItemStyle = () => {
  const length = props.quote.name.length
  
  // Add minimum heights to ensure proper masonry flow
  if (length <= 80) {
    return { minHeight: '120px' }
  } else if (length <= 150) {
    return { minHeight: '160px' }
  } else if (length <= 250) {
    return { minHeight: '200px' }
  } else {
    return { minHeight: '240px' }
  }
}

// Get text size based on quote length
const getTextSizeClass = () => {
  const length = props.quote.name.length
  const index = props.index
  
  if (length <= 80) {
    return index % 7 === 0 ? 'text-size-10 font-700' : 'text-size-8 font-300'
  } 
  
  if (length <= 150) {
    // Medium quotes - varied sizing
    if (index % 5 === 0) return 'text-size-9'
    if (index % 3 === 0) return 'text-size-5 font-600'
    return 'text-size-6 font-500'
  }
  
  if (length <= 250) {
    // Long quotes - larger cards
    if (index % 4 === 0) return 'text-size-8 font-300'
    if (index % 6 === 0) return 'text-size-6 font-500'
    return 'text-size-4 font-500'
  }
  
  // Very long quotes - largest cards
  if (index % 3 === 0) return 'text-size-4 font-500'
  return 'text-size-4 font-500'
}

// Get opacity level for visual variety
const getOpacityLevel = (index) => {
  const levels = [100, 95, 90]
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
      console.error('Failed to check like status:', error)
    }
  }
})
</script>
