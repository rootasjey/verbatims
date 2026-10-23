<template>
  <div class="px-4 py-10 sm:px-8 sm:py-12">
    <div class="mx-auto max-w-xl text-center">
      <p class="font-serif text-3xl leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
        <span class="sr-only">{{ emptyStateHeading }}</span>
        <span aria-hidden="true">{{ typedHeading }}</span>
      </p>

      <p class="mt-3 font-sans text-lg text-gray-500 dark:text-gray-400">
        <span class="sr-only">{{ emptyStateDescription }}</span>
        <span aria-hidden="true">{{ typedDescription }}</span>
      </p>

      <div class="empty-state-actions mt-8 flex flex-wrap items-center justify-center gap-3">
        <NButton
          v-if="hasActiveFilters"
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          {{ $t('quotes.empty_view.clear_filters') }}
        </NButton>

        <NButton
          btn="light:soft-gray dark:soft-blue"
          leading="i-ph-plus-circle"
          class="transition-[transform] duration-150 hover:scale-102 active:scale-99"
          @click="$emit('openSubmitQuote')"
        >
          {{ $t('quotes.empty_view.submit_quote') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

const props = defineProps<{
  searchQuery?: string
  hasActiveFilters?: boolean
}>()

defineEmits<{
  (event: 'clearFilters'): void
  (event: 'openSubmitQuote'): void
}>()

const hasActiveFilters = computed(() => Boolean(props.hasActiveFilters || props.searchQuery?.trim()))
const emptyStateHeading = computed(() => String($t(
  hasActiveFilters.value ? 'quotes.empty_view.no_match' : 'quotes.empty_view.no_quotes'
)))
const emptyStateDescription = computed(() => String($t(
  props.searchQuery?.trim()
    ? 'quotes.empty_view.no_results_for'
    : 'quotes.empty_view.empty_description',
  props.searchQuery?.trim() ? { query: props.searchQuery } : undefined
)))
const { displayedText: typedHeading } = useTypewriterText(emptyStateHeading, hasActiveFilters)
const { displayedText: typedDescription } = useTypewriterText(emptyStateDescription, hasActiveFilters)
</script>

<style scoped>
.empty-state-actions {
  animation: empty-state-actions-in 180ms ease-out 160ms both;
}

@keyframes empty-state-actions-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .empty-state-actions {
    animation: none;
  }
}
</style>
