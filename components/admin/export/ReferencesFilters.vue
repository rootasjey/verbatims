<template>
  <div class="space-y-6">
    <!-- Primary Type Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Primary Type
      </label>
      <div>
        <USelect
          :model-value="modelValue.primary_type"
          @update:model-value="updateFilter('primary_type', $event)"
          :items="primaryTypeOptions"
          item-key="value"
          value-key="value"
          placeholder="All types"
          multiple
        />
      </div>
    </div>

    <!-- Search -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Reference Name (search)
      </label>
      <UInput
        :model-value="modelValue.search"
        @update:model-value="updateFilter('search', $event)"
        placeholder="Search by reference name"
      />
    </div>

    <!-- Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <UInput
          :model-value="modelValue.date_range?.start || ''"
          @update:model-value="updateDateRange('start', $event)"
          type="date"
          placeholder="Start date"
        />
        <UInput
          :model-value="modelValue.date_range?.end || ''"
          @update:model-value="updateDateRange('end', $event)"
          type="date"
          placeholder="End date"
        />
      </div>
    </div>

    <!-- Analytics Filters -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Min Views
        </label>
        <UInput
          :model-value="modelValue.min_views"
          @update:model-value="updateFilter('min_views', Number($event))"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Min Quotes
        </label>
        <UInput
          :model-value="modelValue.min_quotes"
          @update:model-value="updateFilter('min_quotes', Number($event))"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReferenceExportFilters } from '~/types/export'

interface Props {
  modelValue: ReferenceExportFilters
  primaryTypeOptions: Array<{ label: string; value: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: ReferenceExportFilters]
}>()

const updateFilter = (key: keyof ReferenceExportFilters, value: any) => {
  const updated = { ...props.modelValue, [key]: value }
  emit('update:modelValue', updated)
}

const updateDateRange = (type: 'start' | 'end', value: string) => {
  const dateRange = props.modelValue.date_range || { start: '', end: '' }
  const updated = {
    ...props.modelValue,
    date_range: {
      ...dateRange,
      [type]: value
    }
  }
  emit('update:modelValue', updated)
}
</script>
