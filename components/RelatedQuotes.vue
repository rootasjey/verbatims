<template>
  <!-- Related Quotes -->
  <div v-if="relatedQuotes?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-16 mt-16">
    <h3 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white text-center mb-12">Related Quotes</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
      <div
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        class="border border-dashed border-gray-300 dark:border-gray-600 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group"
        @click="navigateTo(`/quotes/${relatedQuote.id}`)"
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
</template>

<script lang="ts" setup>
import type { QuoteWithRelations } from '~/types';

interface Props {
  quote: QuoteWithRelations;
  relatedQuotes?: QuoteWithRelations[];
}

defineProps<Props>();
</script>