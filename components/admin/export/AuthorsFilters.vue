<template>
  <div class="space-y-6">
    <!-- Search -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Author Name (search)
      </label>
      <NInput
        :model-value="modelValue.search"
        @update:model-value="updateFilter('search', $event)"
        placeholder="Search by author name"
      />
    </div>

    <!-- Fictional Status Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Author Type
      </label>
      <div>
        <NSelect
          :model-value="modelValue.is_fictional"
          @update:model-value="updateFilter('is_fictional', $event)"
          :items="fictionalOptions"
          item-key="value"
          value-key="value"
          placeholder="All authors"
        />
      </div>
    </div>

    <!-- Job/Profession Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Job/Profession (search)
      </label>
      <NInput
        :model-value="modelValue.job"
        @update:model-value="updateFilter('job', $event)"
        placeholder="Search by job or profession"
      />
    </div>

    <!-- Creation Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Creation Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <NInput
          :model-value="modelValue.date_range?.start"
          @update:model-value="updateDateRange('date_range', 'start', $event)"
          type="date"
          placeholder="Start date"
        />
        <NInput
          :model-value="modelValue.date_range?.end"
          @update:model-value="updateDateRange('date_range', 'end', $event)"
          type="date"
          placeholder="End date"
        />
      </div>
    </div>

    <!-- Birth Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Birth Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <NInput
          :model-value="modelValue.birth_date_range?.start"
          @update:model-value="updateDateRange('birth_date_range', 'start', $event)"
          type="date"
          placeholder="Birth start date"
        />
        <NInput
          :model-value="modelValue.birth_date_range?.end"
          @update:model-value="updateDateRange('birth_date_range', 'end', $event)"
          type="date"
          placeholder="Birth end date"
        />
      </div>
    </div>

    <!-- Death Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Death Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <NInput
          :model-value="modelValue.death_date_range?.start"
          @update:model-value="updateDateRange('death_date_range', 'start', $event)"
          type="date"
          placeholder="Death start date"
        />
        <NInput
          :model-value="modelValue.death_date_range?.end"
          @update:model-value="updateDateRange('death_date_range', 'end', $event)"
          type="date"
          placeholder="Death end date"
        />
      </div>
    </div>

    <!-- Location Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Birth Location (search)
        </label>
        <NInput
          :model-value="modelValue.birth_location"
          @update:model-value="updateFilter('birth_location', $event)"
          placeholder="Search by birth location"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Death Location (search)
        </label>
        <NInput
          :model-value="modelValue.death_location"
          @update:model-value="updateFilter('death_location', $event)"
          placeholder="Search by death location"
        />
      </div>
    </div>

    <!-- Analytics Filters -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minimum Views
        </label>
        <NInput
          :model-value="modelValue.min_views"
          @update:model-value="updateFilter('min_views', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minimum Likes
        </label>
        <NInput
          :model-value="modelValue.min_likes"
          @update:model-value="updateFilter('min_likes', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minimum Quotes
        </label>
        <NInput
          :model-value="modelValue.min_quotes"
          @update:model-value="updateFilter('min_quotes', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuthorExportFilters } from '~/types/export'

interface Props {
  modelValue: AuthorExportFilters
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: AuthorExportFilters]
}>()

// Options for fictional status filter
const fictionalOptions = [
  { label: 'Real People', value: false },
  { label: 'Fictional Characters', value: true }
]

const updateFilter = (key: keyof AuthorExportFilters, value: any) => {
  const updated = { ...props.modelValue, [key]: value }
  emit('update:modelValue', updated)
}

const updateDateRange = (rangeType: 'date_range' | 'birth_date_range' | 'death_date_range', type: 'start' | 'end', value: string) => {
  const currentRange = props.modelValue[rangeType] || { start: '', end: '' }
  const updated = {
    ...props.modelValue,
    [rangeType]: {
      ...currentRange,
      [type]: value
    }
  }
  emit('update:modelValue', updated)
}
</script>
