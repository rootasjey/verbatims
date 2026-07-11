<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('filters.quote_status') }}
        </label>
        <select
          multiple
          :value="toArray(props.modelValue.status)"
          @change="updateFilter('status', Array.from(($event.target as HTMLSelectElement).selectedOptions).map((o: HTMLOptionElement) => o.value))"
          class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('filters.language') }}
        </label>
        <select
          multiple
          :value="toArray(props.modelValue.language)"
          @change="updateFilter('language', Array.from(($event.target as HTMLSelectElement).selectedOptions).map((o: HTMLOptionElement) => o.value))"
          class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
        >
          <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('filters.author_name') }}
        </label>
        <input
          :model-value="modelValue.author_name"
          @update:model-value="updateFilter('author_name', $event)"
          :placeholder="$ts('filters.search_author')"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
        />
      </div>
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('filters.quote_content') }}
        </label>
        <input
          :model-value="modelValue.search"
          @update:model-value="updateFilter('search', $event)"
          :placeholder="$ts('filters.search_content')"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
        />
      </div>
    </div>

    <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('filters.date_range') }}
        </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.date_range?.start"
          @update:model-value="updateDateRange('start', $event)"
          type="date"
          :placeholder="$ts('filters.start_date')"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.date_range?.end"
          @update:model-value="updateDateRange('end', $event)"
          type="date"
          :placeholder="$ts('filters.end_date')"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          class="accent-gray-700 dark:accent-gray-300"
          :checked="modelValue.featured_only"
          @change="updateFilter('featured_only', ($event.target as HTMLInputElement).checked)"
        />
        <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('filters.featured_only') }}</span>
      </label>
    </div>

    <!-- Analytics Filters -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('filters.min_views') }}
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
          {{ $t('filters.min_likes') }}
        </label>
        <input
          :model-value="modelValue.min_likes"
          @update:model-value="updateFilter('min_likes', Number($event))"
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

type Option<T extends string> = { label: string; value: T }

interface Props {
  modelValue: QuoteExportFilters
  statusOptions: Array<Option<QuoteStatus>>
  languageOptions: Array<Option<QuoteLanguage>>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: QuoteExportFilters]
}>()

const toArray = <T,>(v: T | T[] | undefined): T[] => (Array.isArray(v) ? v : (v != null ? [v] : []))

const statusModel = computed<Array<Option<QuoteStatus>>>({
  get: () => toArray(props.modelValue.status)
    .map(v => props.statusOptions.find(o => o.value === v))
    .filter(Boolean) as Array<Option<QuoteStatus>>,
  set: (opts) => emit('update:modelValue', { ...props.modelValue, status: opts.map(o => o.value) })
})

const languageModel = computed<Array<Option<QuoteLanguage>>>({
  get: () => toArray(props.modelValue.language)
    .map(v => props.languageOptions.find(o => o.value === v))
    .filter(Boolean) as Array<Option<QuoteLanguage>>,
  set: (opts) => emit('update:modelValue', { ...props.modelValue, language: opts.map(o => o.value) })
})

const updateFilter = (key: keyof QuoteExportFilters, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value } as QuoteExportFilters)
}

const updateDateRange = (type: 'start' | 'end', value: string) => {
  const updated = {
    ...props.modelValue,
    date_range: {
      ...(props.modelValue.date_range ?? {}),
      [type]: value
    }
  }
  emit('update:modelValue', updated)
}
</script>
