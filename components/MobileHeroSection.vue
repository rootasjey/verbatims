<template>
  <div class="px-6 py-24 pb-16 rounded-b-8 bg-gradient-to-br from-green-50 to-purple-50 dark:from-#0B0A09 dark:to-black dark:rounded-b-0">
    <div class="mb-2">
      <p class="text-size-6 font-300 line-height-tight text-gray-600 dark:text-gray-400 tracking-wide">
        {{ quote?.author?.name || 'Featured Author' }}
      </p>
    </div>

    <div class="mb-6">
      <p class="font-serif text-size-8 line-height-tight text-gray-800 dark:text-gray-200 leading-relaxed">
        {{ getHeroQuoteText() }}
      </p>
    </div>

    <div class="relative">
      <div 
        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 cursor-pointer transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow-lg"
        @click="handleQuoteInteraction"
      >
        <div class="flex items-center justify-between">
          <span class="text-gray-500 dark:text-gray-400 text-sm">
            Share my quotes...
          </span>
          <UIcon 
            name="i-ph-arrow-right-bold" 
            class="w-5 h-5 text-gray-400 dark:text-gray-500"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~/types';

interface Props {
  quote?: ProcessedQuoteResult
}


const props = withDefaults(defineProps<Props>(), {
  quote: undefined
})

const emit = defineEmits<{
  quoteInteraction: [quoteId: number]
}>()

// Get hero quote text with truncation
const getHeroQuoteText = (): string => {
  if (!props.quote?.name) {
    return 'How do you feel about discovering inspiring quotes today?'
  }
  
  const text = props.quote.name
  if (text.length > 120) {
    return text.slice(0, 120) + '...'
  }
  return text
}

// Handle quote interaction
const handleQuoteInteraction = () => {
  if (props.quote?.id) {
    emit('quoteInteraction', props.quote.id)
  }
}
</script>

<style scoped>
/* Add subtle animations */
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

.hero-section {
  animation: fadeInUp 0.6s ease-out;
}
</style>
