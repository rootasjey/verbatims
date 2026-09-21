<template>
  <div v-if="relatedQuotes?.length" class="mt-24 pt-2">
    <h3 class="mx-auto mb-10 max-w-3xl font-serif text-3xl font-300 tracking-[-0.02em] text-gray-900 dark:text-white">{{ $t('components.related.quotes') }}</h3>
    <div class="mx-auto max-w-3xl space-y-10">
      <NLink
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        :to="`/quotes/${relatedQuote.id}`"
        class="group block rounded-sm no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-500"
      >
        <p class="mb-2 font-sans text-xs text-gray-500 dark:text-gray-400">
          {{ $t(`components.related.reasons.${relatedQuote.relation}`) }}
        </p>
        <p class="max-w-[65ch] font-serif text-base leading-relaxed text-gray-700 underline decoration-gray-400/60 underline-offset-4 transition-colors duration-300 group-hover:text-gray-950 group-hover:decoration-gray-700 dark:text-gray-300 dark:decoration-gray-500/70 dark:group-hover:text-white dark:group-hover:decoration-gray-300 sm:no-underline sm:group-hover:underline sm:group-focus-visible:underline">
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
import type { RelatedQuote } from '~~/shared/types/quote'

interface Props {
  quote: QuoteWithRelations;
  relatedQuotes?: RelatedQuote[];
}

defineProps<Props>();

const { $t } = useI18n()

const truncateText = (text: string, max: number) => {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

</script>
