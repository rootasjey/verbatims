<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p v-if="searchQuery" class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        <span class="sr-only">{{ noMatchHeading }}</span>
        <span aria-hidden="true">{{ typedHeading }}</span>
      </p>
      <p v-else class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        {{ $t('authors.empty_view.no_authors') }}
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        <template v-if="searchQuery">
          <span class="sr-only">{{ noMatchDescription }}</span>
          <span aria-hidden="true">{{ typedDescription }}</span>
        </template>
        <template v-else>{{ $t('authors.empty_view.empty_description') }}</template>
      </p>

      <div class="empty-state-actions mt-8 flex flex-wrap items-center justify-center gap-3">
        <NButton
          v-if="searchQuery"
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          {{ $t('authors.empty_view.clear_filters') }}
        </NButton>

        <NButton
          btn="light:soft-gray dark:soft-blue"
          leading="i-ph-plus-circle"
          class="hover:scale-102 active:scale-99 transition-[transform] duration-150"
          @click="$emit('openSubmitAuthor')"
        >
          {{ $t('authors.empty_view.submit_author') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { $t } = useI18n()

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

const noMatchHeading = computed(() => String($t('authors.empty_view.no_match')))
const noMatchDescription = computed(() => String($t('authors.empty_view.no_results_for', { query: props.searchQuery })))
const shouldAnimateNoMatch = computed(() => Boolean(props.searchQuery))
const { displayedText: typedHeading } = useTypewriterText(noMatchHeading, shouldAnimateNoMatch)
const { displayedText: typedDescription } = useTypewriterText(noMatchDescription, shouldAnimateNoMatch)

defineEmits(['openSubmitAuthor', 'clearFilters'])
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
