<template>
  <div class="space-y-6">
    <!-- Primary Type Filter -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        {{ $ts('filters.primary_type') }}
      </label>
      <div>
        <select
          multiple
          :value="primaryTypeModel.map(o => o.value)"
          @change="primaryTypeModel = Array.from(($event.target as HTMLSelectElement).selectedOptions).map(o => ({ label: o.text, value: o.value }))"
          class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
        >
          <option v-for="opt in primaryTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Search -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        {{ $ts('filters.reference_name') }}
      </label>
      <input
        :model-value="modelValue.search"
        @update:model-value="updateFilter('search', $event)"
        :placeholder="$ts('filters.search_reference')"
        class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
      />
    </div>

    <!-- Date Range -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        {{ $ts('filters.date_range') }}
      </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.date_range?.start || ''"
          @update:model-value="updateDateRange('start', $event)"
          type="date"
          :placeholder="$ts('filters.start_date')"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.date_range?.end || ''"
          @update:model-value="updateDateRange('end', $event)"
          type="date"
          :placeholder="$ts('filters.end_date')"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Analytics Filters -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $ts('filters.min_views') }}
        </label>
        <input
          :model-value="modelValue.min_views"
          @update:model-value="updateFilter('min_views', Number($event))"
          type="number"
          min="0"
          placeholder="0"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
        />
      </div>
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $ts('filters.min_quotes') }}
        </label>
        <input
          :model-value="modelValue.min_quotes"
          @update:model-value="updateFilter('min_quotes', Number($event))"
          type="number"
          min="0"
          placeholder="0"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

interface Props {
  modelValue: ReferenceExportFilters
  primaryTypeOptions: Array<{ label: string; value: string }>
}

import { computed } from 'vue'

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

type Option = { label: string; value: string }

// Computed binding for the primary_type filter (maps between `string[]` in model and `Option[]` for NSelect)
const primaryTypeModel = computed({
  get(): Option[] {
    const val = props.modelValue.primary_type
    const values = Array.isArray(val) ? val : (val ? [val] : [])
    return values.map(v => props.primaryTypeOptions.find(o => o.value === v) ?? { label: v, value: v })
  },
  set(options: Option[]) {
    const values = options?.map(o => o.value) ?? []
    updateFilter('primary_type', values)
  }
})
</script>
