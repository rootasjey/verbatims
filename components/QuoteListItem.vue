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
        <UAvatar
          v-if="showAvatar"
          :src="quote.author?.image_url || quote.author_image_url || undefined"
          :alt="quote.author?.name || 'Unknown Author'"
          size="xs"
          rounded="full"
          square="1.5rem"
        />
        <span class="text-sm font-600 text-gray-700 dark:text-gray-300 truncate">
          {{ quote.author?.name || quote.author_name || 'Unknown Author' }}
        </span>
      </div>

      <!-- Reference Info -->
    <div v-if="quote.reference || quote.reference_type" class="flex items-center space-x-2">
        <UBadge
      v-if="(quote.reference && quote.reference.type) || quote.reference_type"
      :color="getReferenceTypeColor(quote.reference?.type || quote.reference_type as string)"
          variant="subtle"
          size="xs"
          class="text-xs"
        >
      {{ formatReferenceType((quote.reference?.type || quote.reference_type) as string) }}
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

<script lang="ts" setup>
import type { ProcessedQuoteResult } from '~/types'

interface Props {
  quote: ProcessedQuoteResult
  showAvatar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
})

const isHovered = ref(false)

const navigateToQuote = () => {
  navigateTo(`/quotes/${props.quote.id}`)
}

const getReferenceTypeColor = (type: string) => {
  const colors: Record<string, string> = {
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
      url: `${window.location.origin}/quotes/${props.quote.id}`
    })
  } else {
    // Fallback: copy to clipboard
  navigator.clipboard.writeText(`"${props.quote.name}" - ${props.quote.author?.name || props.quote.author_name || 'Unknown'}`)
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
