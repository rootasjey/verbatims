<template>
  <div
    v-if="quote"
    class="quote-hero bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-dashed border-primary-200 dark:border-primary-700 rounded-lg p-6 mb-8 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-101 active:scale-99"
    @click="navigateToQuote"
  >
    <!-- Hero Badge -->
    <div class="flex items-center justify-between mb-4">
      <NBadge color="primary" variant="subtle" size="sm">
        <NIcon name="i-ph-star-bold" class="w-3 h-3 mr-1" />
        Featured Quote
      </NBadge>
      
      <!-- Share Button -->
      <NButton
        icon
        btn="ghost-gray"
        label="i-ph-share"
        size="sm"
        @click.stop="handleShare"
        class="hover:text-primary-600"
      />
    </div>

    <div class="mb-4">
      <blockquote class="font-serif text-xl leading-relaxed text-gray-800 dark:text-gray-200 mb-4">
        "{{ quote.name }}"
      </blockquote>
    </div>

    <!-- Attribution -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col">
        <!-- Author -->
        <div class="flex items-center space-x-2 mb-1">
          <span class="font-600 text-gray-900 dark:text-gray-100">
            {{ quote.author?.name || 'Unknown Author' }}
          </span>
        </div>
        
        <!-- Reference -->
        <div v-if="quote.reference" class="flex items-center space-x-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            from {{ quote.reference.name }}
          </span>
          <NBadge
            v-if="quote.reference.primary_type"
            :color="getReferenceTypeColor(quote.reference.primary_type)"
            variant="subtle"
            size="xs"
          >
            {{ quote.reference.primary_type }}
          </NBadge>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2">
        <NButton
          icon
          btn="ghost-gray"
          label="i-ph-heart"
          size="sm"
          @click.stop="handleLike"
          class="hover:text-red-500"
        />
        
        <NButton
          icon
          btn="ghost-gray"
          label="i-ph-arrow-right"
          size="sm"
          @click.stop="navigateToQuote"
          class="hover:text-primary-600"
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

const navigateToQuote = () => {
  navigateTo(`/quotes/${props.quote.id}`)
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

const handleLike = () => {
  // TODO: Implement like functionality
  console.log('Like hero quote:', props.quote.id)
}

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: 'Featured Quote from Verbatims',
      text: `"${props.quote.name}" - ${props.quote.author?.name || 'Unknown'}`,
      url: `${window.location.origin}/quotes/${props.quote.id}`
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`"${props.quote.name}" - ${props.quote.author?.name || 'Unknown'}`)
  }
}
</script>

<style scoped>
.quote-hero {
  /* Ensure proper touch targets on mobile */
  min-height: 200px;
}

/* Add subtle animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quote-hero {
  animation: fadeInUp 0.6s ease-out;
}
</style>
