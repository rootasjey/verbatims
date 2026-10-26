<template>
  <section v-if="relatedQuotes?.length" class="mx-auto mt-16 max-w-5xl rounded-[2rem] bg-[#F1F0EB] px-5 py-8 dark:bg-[#121110] md:mt-24 md:px-10 md:py-10" :aria-label="String($t('components.related.quotes'))">
    <h3 class="mb-7 font-serif text-2xl font-300 tracking-[-0.02em] text-gray-700 dark:text-gray-300 md:mb-8">{{ $t('components.related.quotes') }}</h3>
    <div class="grid gap-3 md:grid-cols-2 md:gap-4">
      <NLink
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        :to="`/quotes/${relatedQuote.id}`"
        class="group flex h-full flex-col rounded-2xl bg-white/55 p-5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-sm active:translate-y-0 active:scale-[0.99] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        <p class="mb-1.5 font-sans text-xs text-gray-500 dark:text-gray-500">
          {{ $t(`components.related.reasons.${relatedQuote.relation}`) }}
        </p>
        <p class="max-w-[65ch] font-serif text-base leading-relaxed text-gray-700 transition-colors duration-200 group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-white">
          {{ truncateText(relatedQuote.name, 200) }}
        </p>
        <p v-if="relatedQuote.author" class="mt-3 font-sans text-sm text-gray-500 dark:text-gray-400">
          — {{ relatedQuote.author.name }}
        </p>
      </NLink>
    </div>
  </section>
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
