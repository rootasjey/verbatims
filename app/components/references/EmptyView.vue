<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        <span class="sr-only">{{ emptyStateHeading }}</span>
        <span aria-hidden="true">{{ typedHeading }}</span>
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
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
          {{ $t('references.empty_view.clear_filters') }}
        </NButton>

        <NButton
          btn="light:soft-secondary dark:soft-blue"
          leading="i-ph-plus-circle"
          class="hover:scale-102 active:scale-99 transition-[transform] duration-150"
          @click="$emit('openSubmitReference')"
        >
          {{ $t('references.empty_view.submit_reference') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  selectedType: {
    type: [String, Object],
    default: ''
  }
})

defineEmits(['openSubmitReference', 'clearFilters'])

const selectedTypeLabel = computed(() => {
  if (!props.selectedType) return ''

  const normalized = typeof props.selectedType === 'string'
    ? props.selectedType
    : String((props.selectedType as { value?: string; label?: string })?.value || '')

  if (!normalized) return ''

  const translated = $t(`reference_types.${normalized}`)
  if (translated !== `reference_types.${normalized}`) return String(translated)

  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
})

const hasActiveFilters = computed(() => {
  return Boolean(props.searchQuery?.trim() || props.selectedType)
})

const emptyDescription = computed(() => {
  if (props.searchQuery?.trim() && selectedTypeLabel.value) {
    return $t('references.empty_view.no_results_for_type', { query: props.searchQuery, type: selectedTypeLabel.value })
  }

  if (props.searchQuery?.trim()) {
    return $t('references.empty_view.no_match_with_query', { query: props.searchQuery })
  }

  if (selectedTypeLabel.value) {
    return $t('references.empty_view.no_references_in_type', { type: selectedTypeLabel.value })
  }

  return $t('references.empty_view.empty_description')
})

const emptyStateHeading = computed(() => String($t(
  hasActiveFilters.value ? 'references.empty_view.no_match' : 'references.empty_view.no_references'
)))
const emptyStateDescription = computed(() => String(emptyDescription.value))
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
