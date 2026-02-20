<template>
  <div class="mb-12">
    <div class="max-w-3xl mx-auto border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 bg-gray-50/70 dark:bg-[#0C0A09]">
      <div class="flex flex-col items-center text-center">
        <div class="w-14 h-14 rounded-full bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center mb-5">
          <NIcon name="i-ph-books" class="w-7 h-7 text-gray-700 dark:text-gray-300" />
        </div>

        <h2 class="font-subtitle text-3xl line-height-none font-600 mb-3">
          {{ hasActiveFilters ? 'No references match this filter' : 'No references yet' }}
        </h2>

        <p class="font-sans text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
          {{ emptyDescription }}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <NButton
            v-if="hasActiveFilters"
            btn="soft-gray"
            label="Clear filters"
            leading="i-ph-funnel-simple-x"
            @click="$emit('clearFilters')"
          />

          <NButton
            label="Submit a quote"
            leading="i-ph-plus"
            @click="$emit('openSubmitModal')"
          />
        </div>
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
    return `No results for “${props.searchQuery}” in ${selectedTypeLabel.value}. Try a broader search or clear filters.`
  }

  if (props.searchQuery?.trim()) {
    return `No references match “${props.searchQuery}”. Try another keyword or clear filters.`
  }

  if (selectedTypeLabel.value) {
    return `No references are available in ${selectedTypeLabel.value} yet. Try another type or submit a quote to add one.`
  }

  return 'References appear as quotes are submitted with source details. Submit a quote to start building the collection.'
})
</script>
