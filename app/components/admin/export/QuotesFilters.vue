<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quote Status
        </label>
        <NSelect
          v-model="statusModel"
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
        <NSelect
          v-model="languageModel"
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
        <NInput
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
        <NInput
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
        <NInput
          :model-value="modelValue.date_range.start"
          @update:model-value="updateDateRange('start', $event)"
          type="date"
          placeholder="Start date"
        />
        <NInput
          :model-value="modelValue.date_range.end"
          @update:model-value="updateDateRange('end', $event)"
          type="date"
          placeholder="End date"
        />
      </div>
    </div>

    <div>
      <NCheckbox
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
        <NInput
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
        <NInput
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
      ...props.modelValue.date_range,
      [type]: value
    }
  }
  emit('update:modelValue', updated)
}
</script>
