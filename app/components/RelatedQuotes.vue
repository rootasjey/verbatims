<template>
  <div v-if="relatedQuotes?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-16 mt-16">
    <h3 class="max-w-3xl mx-auto text-size-12 font-title font-200 uppercase text-gray-900 dark:text-white mb-12">Related Quotes</h3>
    <div class="max-w-3xl space-y-6 mx-auto">
      <NLink
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        :to="`/quotes/${relatedQuote.id}`"
        class="group block no-underline"
      >
        <p class="font-serif text-base md:text-lg text-gray-700 dark:text-gray-300 group-hover:text-white dark:group-hover:text-white leading-relaxed relative overflow-hidden py-1 -mx-1.5 px-1.5 transition-colors duration-300">
          <span class="absolute inset-0 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-out" :style="{ background: getTagBackground(relatedQuote) }" />
          <span class="relative">
            <span class="text-gray-400 dark:text-gray-500 select-none mr-1">“</span>
            {{ truncateText(relatedQuote.name, 200) }}
            <span class="text-gray-400 dark:text-gray-500 select-none ml-1">”</span>
          </span>
        </p>
        <p v-if="relatedQuote.author" class="mt-1.5 font-sans text-sm text-gray-500 dark:text-gray-400">
          — {{ relatedQuote.author.name }}
        </p>
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

const truncateText = (text: string, max: number) => {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

const getTagBackground = (quote: QuoteWithRelations) => {
  const tags = quote.tags || []
  const colors = tags.map(t => t.color?.trim()).filter(Boolean)
  if (colors.length === 0) return '#0C0A09'
  if (colors.length === 1) return `${colors[0]}25`
  return `linear-gradient(135deg, ${colors.map(c => c + '15').join(', ')})`
}
</script>
