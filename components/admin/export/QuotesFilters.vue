<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quote Status
        </label>
        <USelect
          :model-value="modelValue.status"
          @update:model-value="updateFilter('status', $event)"
          :items="statusOptions"
          item-key="label"
          value-key="label"
          placeholder="All statuses"
          multiple
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language
        </label>
        <USelect
          :model-value="modelValue.language"
          @update:model-value="updateFilter('language', $event)"
          :items="languageOptions"
          item-key="label"
          value-key="label"
          placeholder="All languages"
          multiple
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Author Name
        </label>
        <UInput
          :model-value="modelValue.author_name"
          @update:model-value="updateFilter('author_name', $event)"
          placeholder="Search by author name"
          class="mx-0.5"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quote Content
        </label>
        <UInput
          :model-value="modelValue.search"
          @update:model-value="updateFilter('search', $event)"
          placeholder="Search in quote content"
          class="mx-0.5"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <UInput
          :model-value="modelValue.date_range.start"
          @update:model-value="updateDateRange('start', $event)"
          type="date"
          placeholder="Start date"
        />
        <UInput
          :model-value="modelValue.date_range.end"
          @update:model-value="updateDateRange('end', $event)"
          type="date"
          placeholder="End date"
        />
      </div>
    </div>

    <div>
      <UCheckbox
        :model-value="modelValue.featured_only"
        @update:model-value="updateFilter('featured_only', $event)"
        label="Featured quotes only"
      />
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
          Min Likes
        </label>
        <UInput
          :model-value="modelValue.min_likes"
          @update:model-value="updateFilter('min_likes', Number($event))"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuoteExportFilters } from '~/types/export'

interface Props {
  modelValue: QuoteExportFilters
  statusOptions: Array<{ label: string; value: string }>
  languageOptions: Array<{ label: string; value: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: QuoteExportFilters]
}>()

const updateFilter = (key: keyof QuoteExportFilters, value: any) => {
  const updated = { ...props.modelValue, [key]: value }
  emit('update:modelValue', updated)
}

const updateDateRange = (type: 'start' | 'end', value: string) => {
  const updated = {
    ...props.modelValue,
    date_range: {
      ...props.modelValue.date_range,
      [type]: value
    }
  }
  emit('update:modelValue', updated)
}
</script>
