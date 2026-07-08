<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        {{ hasActiveFilters ? 'No references match' : 'No references yet.' }}
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        {{ emptyDescription }}
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NButton
          v-if="hasActiveFilters"
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          Clear filters
        </NButton>

        <NButton
          btn="soft-secondary"
          leading="i-ph-plus-circle"
          class="hover:scale-105 active:scale-99 transition-[transform] duration-150"
          @click="$emit('openSubmitModal')"
        >
          Submit a quote
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

defineEmits(['openSubmitModal', 'clearFilters'])

const selectedTypeLabel = computed(() => {
  if (!props.selectedType) return ''

  const normalized = typeof props.selectedType === 'string'
    ? props.selectedType
    : String((props.selectedType as { value?: string; label?: string })?.value || '')

  if (!normalized) return ''

  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
})

const hasActiveFilters = computed(() => {
  return Boolean(props.searchQuery?.trim() || props.selectedType)
})

const emptyDescription = computed(() => {
  if (props.searchQuery?.trim() && selectedTypeLabel.value) {
    return `No results for &ldquo;${props.searchQuery}&rdquo; in ${selectedTypeLabel.value}. Try a broader search or clear filters.`
  }

  if (props.searchQuery?.trim()) {
    return `No references match &ldquo;${props.searchQuery}&rdquo;. Try another keyword or clear filters.`
  }

  if (selectedTypeLabel.value) {
    return `No references are available in ${selectedTypeLabel.value} yet. Try another type or submit a quote to add one.`
  }

  return 'Every quote comes from somewhere. Add a source when you submit a quote and help build the reference library.'
})
</script>
