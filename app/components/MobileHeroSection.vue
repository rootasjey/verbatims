<template>
  <div class="px-6 pt-8 pb-6">
    <!-- Featured label -->
    <div v-if="quote" class="flex items-center gap-2 mb-4">
      <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: 'var(--theme-secondary, #FAB95B)' }" />
      <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
        Featured
      </p>
    </div>

    <!-- Author row -->
    <div v-if="quote?.author" @click="handleClickAuthor" class="flex items-center gap-3 mb-4 cursor-pointer group">
      <div
        v-if="quote.author.image_url"
        class="w-8 h-8 rounded-full overflow-hidden grayscale"
      >
        <img :src="quote.author.image_url" :alt="quote.author.name" class="w-full h-full object-cover" />
      </div>
      <div v-else class="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <span class="font-serif text-xs text-gray-400 dark:text-gray-500">
          {{ getAuthorInitials(quote.author.name) }}
        </span>
      </div>
      <div>
        <p class="font-subtitle text-lg font-600 text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          {{ quote.author.name }}
        </p>
        <p v-if="quote.reference" class="font-sans text-xs text-gray-500 dark:text-gray-400">
          {{ quote.reference.name }}
        </p>
      </div>
    </div>

    <!-- Quote text -->
    <div @click="handleClickQuote" class="mb-6 cursor-pointer group">
      <blockquote class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100 leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
        {{ getHeroQuoteText() }}
      </blockquote>
    </div>

    <!-- Dashed divider -->
    <div class="border-b border-dashed border-gray-300 dark:border-gray-700 mb-6" />

    <!-- Share prompt -->
    <div
      class="flex items-center justify-between cursor-pointer group"
      @click="handleNewQuote"
    >
      <span class="font-sans text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
        Share my quotes
      </span>
      <NIcon
        name="i-ph-arrow-right-bold"
        class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types';

interface Props {
  quote?: ProcessedQuoteResult
}

const props = withDefaults(defineProps<Props>(), {
  quote: undefined
})

const emit = defineEmits<{
  onClickQuote: [quoteId: number]
  onClickAuthor: [authorId: number]
  newQuote: []
}>()

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

const getAuthorInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const handleClickQuote = () => {
  if (props.quote?.id) {
    emit('onClickQuote', props.quote.id)
  }
}

const handleClickAuthor = () => {
  if (props.quote?.author?.id) {
    emit('onClickAuthor', props.quote.author.id)
  }
}

const handleNewQuote = () => {
  emit('newQuote')
}
</script>

<style scoped>
.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.group:hover .grayscale {
  filter: grayscale(0%);
  transform: scale(1.05);
}
</style>
