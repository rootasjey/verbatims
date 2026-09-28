<template>
  <section v-if="relatedQuotes?.length" class="mx-auto mt-16 max-w-5xl rounded-[2rem] bg-[#F1F0EB] px-5 py-8 dark:bg-[#121110] md:mt-24 md:px-10 md:py-10" :aria-label="String($t('components.related.quotes'))">
    <h3 class="mb-7 font-serif text-2xl font-300 tracking-[-0.02em] text-gray-700 dark:text-gray-300 md:mb-8">{{ $t('components.related.quotes') }}</h3>
    <div class="space-y-6 md:space-y-7">
      <NLink
        v-for="relatedQuote in relatedQuotes"
        :key="relatedQuote.id"
        :to="`/quotes/${relatedQuote.id}`"
        class="group block border-t border-black/8 pt-5 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-500 first:border-0 first:pt-0 dark:border-white/10 md:pt-6"
      >
        <p class="mb-1.5 font-sans text-xs text-gray-500 dark:text-gray-500">
          {{ $t(`components.related.reasons.${relatedQuote.relation}`) }}
        </p>
        <p class="max-w-[65ch] font-serif text-base leading-relaxed text-gray-700 underline decoration-gray-400/60 underline-offset-4 transition-colors duration-300 group-hover:text-gray-950 group-hover:decoration-gray-700 dark:text-gray-400 dark:decoration-gray-500/70 dark:group-hover:text-white dark:group-hover:decoration-gray-300 sm:no-underline sm:group-hover:underline sm:group-focus-visible:underline">
          {{ truncateText(relatedQuote.name, 200) }}
        </p>
        <p v-if="relatedQuote.author" class="mt-1.5 font-sans text-sm text-gray-500 dark:text-gray-500">
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
