<template>
  <div v-if="relatedQuotes?.length" class="mt-24 pt-2">
    <h3 class="mx-auto mb-10 max-w-3xl font-serif text-3xl font-300 tracking-[-0.02em] text-gray-900 dark:text-white">{{ $t('components.related.quotes') }}</h3>
    <div class="mx-auto max-w-3xl space-y-10">
      <NLink
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        :to="`/quotes/${relatedQuote.id}`"
        class="group block no-underline"
      >
        <p class="font-serif text-base leading-relaxed text-gray-700 transition-colors duration-300 group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-white">
          {{ truncateText(relatedQuote.name, 200) }}
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

const { $t } = useI18n()

const truncateText = (text: string, max: number) => {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

</script>
