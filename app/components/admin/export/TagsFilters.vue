<template>
  <div class="space-y-4">
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">{{ $ts('filters.search_label') }}</label>
      <input v-model="model.search" :placeholder="$ts('filters.search_tags')" class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">{{ $ts('filters.category') }}</label>
        <div>
          <select
            multiple
            :value="categoryModel.map(o => o.label)"
            @change="categoryModel = Array.from(($event.target as HTMLSelectElement).selectedOptions).map(o => ({ label: o.value, value: o.value }))"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
          >
            <option v-for="opt in categoryOptions" :key="opt.label" :value="opt.label">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">{{ $ts('filters.color') }}</label>
        <div>
          <select
            multiple
            :value="colorModel.map(o => o.label)"
            @change="colorModel = Array.from(($event.target as HTMLSelectElement).selectedOptions).map(o => ({ label: o.value, value: o.value }))"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
          >
            <option v-for="opt in colorOptions" :key="opt.label" :value="opt.label">{{ opt.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">{{ $ts('filters.created_from') }}</label>
        <input v-model="dateStart" type="date" class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full" />
      </div>
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">{{ $ts('filters.created_to') }}</label>
        <input v-model="dateEnd" type="date" class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full" />
      </div>
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">{{ $ts('filters.minimum_usage') }}</label>
        <input type="number" v-model.number="model.min_usage" :min="0" class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none" />
      </div>
    </div>

    <div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="model.unused_only" class="accent-gray-700 dark:accent-gray-300" />
        <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $ts('filters.unused_only') }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

const model = defineModel<TagExportFilters>({ default: {} as any })

// Simple in-UI category/color options. You can replace with API-fed options later.
const categoryOptions = [
  { label: $ts('filters.category_general'), value: 'General' },
  { label: $ts('filters.category_theme'), value: 'Theme' },
  { label: $ts('filters.category_topic'), value: 'Topic' },
]

const colorOptions = [
  { label: '#3B82F6', value: '#3B82F6' },
  { label: '#22C55E', value: '#22C55E' },
  { label: '#F59E0B', value: '#F59E0B' },
  { label: '#EF4444', value: '#EF4444' },
]

const categoryModel = computed({
  get: () => (Array.isArray(model.value.category) ? (model.value.category as string[]).map(v => ({ label: v, value: v })) : []),
  set: (arr: Array<{ label: string; value: string }>) => { model.value.category = arr.map(i => i.value) }
})

const colorModel = computed({
  get: () => (Array.isArray(model.value.color) ? (model.value.color as string[]).map(v => ({ label: v, value: v })) : []),
  set: (arr: Array<{ label: string; value: string }>) => { model.value.color = arr.map(i => i.value) }
})

const dateStart = computed({
  get: () => model.value.date_range?.start || '',
  set: (v: string) => {
    model.value.date_range = model.value.date_range || { start: '', end: '' }
    model.value.date_range.start = v
  }
})

const dateEnd = computed({
  get: () => model.value.date_range?.end || '',
  set: (v: string) => {
    model.value.date_range = model.value.date_range || { start: '', end: '' }
    model.value.date_range.end = v
  }
})
</script>
