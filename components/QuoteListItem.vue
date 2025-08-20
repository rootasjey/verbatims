<template>
  <div
    class="quote-list-item group p-4 cursor-pointer transition-all duration-300 hover:shadow-md"
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Author and Reference Info (Top) -->
    <div class="flex items-center justify-between mb-3">
      <!-- Author Name with Avatar -->
      <div class="flex items-center space-x-2">
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-lime-500 flex items-center justify-center text-white text-xs font-bold">
          {{ getAuthorInitials() }}
        </div>
        <span v-if="quote.author" class="text-sm font-600 text-gray-700 dark:text-gray-300 truncate">
          {{ quote.author.name }}
        </span>
        <span v-else class="text-sm text-gray-400 dark:text-gray-500 italic">
          Unknown Author
        </span>
      </div>

      <!-- Reference Info -->
      <div v-if="quote.reference" class="flex items-center space-x-2">
        <UBadge
          v-if="quote.reference.primary_type"
          :color="getReferenceTypeColor(quote.reference.primary_type)"
          variant="subtle"
          size="xs"
          class="text-xs"
        >
          {{ quote.reference.primary_type }}
        </UBadge>
      </div>
    </div>

    <!-- Quote Content (Main) -->
    <div class="mb-3">
      <blockquote
        class="font-serif text-gray-800 dark:text-gray-200 leading-relaxed"
        :class="{
          'text-sm': (quote.name || '').length > 200,
          'text-base': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
          'text-lg': (quote.name || '').length <= 100
        }"
      >
        {{ quote.name }}
      </blockquote>
    </div>

    <!-- Bottom Row: Tags and Actions -->
    <div class="flex items-center justify-between">
      <!-- Tags (if any) -->
      <div class="flex items-center space-x-2">
        <UBadge
          v-if="quote.is_featured"
          color="yellow"
          variant="subtle"
          size="xs"
        >
          Featured
        </UBadge>
      </div>

      <!-- Action Buttons (show on hover/touch) -->
      <div 
        class="flex items-center space-x-2 transition-opacity duration-300"
        :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
      >
        <!-- Like Button -->
        <UButton
          icon
          btn="ghost-gray"
          label="i-ph-heart"
          size="xs"
          @click.stop="handleLike"
          class="hover:text-red-500"
        />
        
        <!-- Share Button -->
        <UButton
          icon
          btn="ghost-gray"
          label="i-ph-share"
          size="xs"
          @click.stop="handleShare"
          class="hover:text-blue-500"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  quote: {
    type: Object,
    required: true
  }
})

const isHovered = ref(false)

const navigateToQuote = () => {
  navigateTo(`/quote/${props.quote.id}`)
}

const getReferenceTypeColor = (type) => {
  const colors = {
    'book': 'green',
    'film': 'blue',
    'tv_series': 'purple',
    'video_game': 'orange',
    'music': 'pink',
    'podcast': 'indigo',
    'documentary': 'teal',
    'speech': 'red'
  }
  return colors[type] || 'gray'
}

const getAuthorInitials = () => {
  const name = props.quote.author?.name || 'Unknown'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const handleLike = () => {
  // TODO: Implement like functionality
  console.log('Like quote:', props.quote.id)
}

const handleShare = () => {
  // TODO: Implement share functionality
  if (navigator.share) {
    navigator.share({
      title: 'Quote from Verbatims',
      text: props.quote.name,
      url: `${window.location.origin}/quote/${props.quote.id}`
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`"${props.quote.name}" - ${props.quote.author?.name || 'Unknown'}`)
  }
}
</script>

<style scoped>
/* Mobile-specific optimizations */
@media (max-width: 767px) {
  .quote-list-item {
    /* Always show action buttons on mobile for better accessibility */
    .opacity-0 {
      opacity: 0.6;
    }
  }
}
</style>
