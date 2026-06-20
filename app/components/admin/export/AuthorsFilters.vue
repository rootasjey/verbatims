<template>
  <div class="space-y-6">
    <!-- Search -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Author Name (search)
      </label>
      <input
        :model-value="modelValue.search"
        @update:model-value="updateFilter('search', $event)"
        placeholder="Search by author name"
        class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
      />
    </div>

    <!-- Fictional Status Filter -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Author Type
      </label>
      <div>
        <select
          :value="fictionalModel?.value === undefined ? '' : String(fictionalModel.value)"
          @change="fictionalModel = (($event.target as HTMLSelectElement).value === '' ? null : fictionalOptions.find(o => String(o.value) === ($event.target as HTMLSelectElement).value) ?? null)"
          class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
        >
          <option value="">All authors</option>
          <option v-for="opt in fictionalOptions" :key="String(opt.value)" :value="String(opt.value)">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Job/Profession Filter -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Job/Profession (search)
      </label>
      <input
        :model-value="modelValue.job"
        @update:model-value="updateFilter('job', $event)"
        placeholder="Search by job or profession"
        class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
      />
    </div>

    <!-- Creation Date Range -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Creation Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.date_range?.start"
          @update:model-value="updateDateRange('date_range', 'start', $event)"
          type="date"
          placeholder="Start date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.date_range?.end"
          @update:model-value="updateDateRange('date_range', 'end', $event)"
          type="date"
          placeholder="End date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Birth Date Range -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Birth Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.birth_date_range?.start"
          @update:model-value="updateDateRange('birth_date_range', 'start', $event)"
          type="date"
          placeholder="Birth start date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.birth_date_range?.end"
          @update:model-value="updateDateRange('birth_date_range', 'end', $event)"
          type="date"
          placeholder="Birth end date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Death Date Range -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Death Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.death_date_range?.start"
          @update:model-value="updateDateRange('death_date_range', 'start', $event)"
          type="date"
          placeholder="Death start date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.death_date_range?.end"
          @update:model-value="updateDateRange('death_date_range', 'end', $event)"
          type="date"
          placeholder="Death end date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Location Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Birth Location (search)
        </label>
        <input
          :model-value="modelValue.birth_location"
          @update:model-value="updateFilter('birth_location', $event)"
          placeholder="Search by birth location"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
        />
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Death Location (search)
        </label>
        <input
          :model-value="modelValue.death_location"
          @update:model-value="updateFilter('death_location', $event)"
          placeholder="Search by death location"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
        />
      </div>
    </div>

    <!-- Analytics Filters -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Minimum Views
        </label>
        <input
          :model-value="modelValue.min_views"
          @update:model-value="updateFilter('min_views', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
        />
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Minimum Likes
        </label>
        <input
          :model-value="modelValue.min_likes"
          @update:model-value="updateFilter('min_likes', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
        />
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Minimum Quotes
        </label>
        <input
          :model-value="modelValue.min_quotes"
          @update:model-value="updateFilter('min_quotes', $event ? parseInt($event) : 0)"
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
interface Props {
  modelValue: AuthorExportFilters
}

import { computed } from 'vue'

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: AuthorExportFilters]
}>()

type Option<T = string> = { label: string; value: T }

const fictionalModel = computed<Option<boolean> | null>({
  get() {
    const val = props.modelValue.is_fictional
    if (val === undefined || val === null) return null
    return fictionalOptions.find(o => o.value === val) ?? { label: String(val), value: val }
  },
  set(option) {
    const val = option ? option.value : undefined
    updateFilter('is_fictional', val)
  }
})
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
