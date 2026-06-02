<template>
  <div v-if="relatedQuotes?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-16 mt-16">
    <h3 class="text-size-12 font-title font-700 uppercase text-gray-900 dark:text-white text-center mb-12">Related Quotes</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
      <NLink
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        :to="`/quotes/${relatedQuote.id}`"
        class="h-full block group border border-dashed border-gray-300 dark:border-gray-600 rounded-1 p-5 bg-white dark:bg-[#101010] hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:scale-99 transition-all duration-200"
      >
        <blockquote class="font-subtitle font-300 text-size-5 text-gray-800 dark:text-gray-200 mb-4 line-clamp-6 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {{ relatedQuote.name }}
        </blockquote>
        <div class="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span v-if="relatedQuote.author" class="font-sans italic">{{ relatedQuote.author.name }}</span>
        </div>
      </NLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  quote: QuoteWithRelations;
  relatedQuotes?: QuoteWithRelations[];
}

defineProps<Props>();
</script>