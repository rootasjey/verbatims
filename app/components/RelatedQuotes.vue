<template>
  <div v-if="relatedQuotes?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-16 mt-16">
    <h3 class="text-size-12 font-title font-700 uppercase text-gray-900 dark:text-white text-center mb-12">Related Quotes</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
      <div
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        class="h-full rounded-xl flex flex-col justify-between bg-white dark:bg-[#0C0A09] border p-4 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition cursor-pointer group overflow-hidden"
        role="button"
        tabindex="0"
        @click="navigateTo(`/quotes/${relatedQuote.id}`)"
        @keyup.enter="navigateTo(`/quotes/${relatedQuote.id}`)"
      >
        <blockquote class="font-serif text-lg text-gray-800 dark:text-gray-200 mb-4 line-clamp-6 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {{ relatedQuote.name }}
        </blockquote>
        <div class="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span v-if="relatedQuote.author" class="font-sans italic">{{ relatedQuote.author.name }}</span>
        </div>
      </div>
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