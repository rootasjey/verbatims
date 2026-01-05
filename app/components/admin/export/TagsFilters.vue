<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
      <NInput v-model="model.search" placeholder="Search tags by name or description" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
        <div>
          <NSelect
            v-model="categoryModel"
            :items="categoryOptions"
            item-key="label"
            value-key="label"
            placeholder="Select categories"
            multiple
          />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
        <div>
          <NSelect
            v-model="colorModel"
            :items="colorOptions"
            item-key="label"
            value-key="label"
            placeholder="Select colors"
            multiple
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created from</label>
        <NInput v-model="dateStart" type="date" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created to</label>
        <NInput v-model="dateEnd" type="date" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum usage</label>
        <NInput v-model.number="model.min_usage" type="number" min="0" placeholder="0" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <NCheckbox v-model="model.unused_only" label="Only tags with no usage" />
    </div>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<TagExportFilters>({ default: {} as any })

// Simple in-UI category/color options. You can replace with API-fed options later.
const categoryOptions = [
  { label: 'General', value: 'General' },
  { label: 'Theme', value: 'Theme' },
  { label: 'Topic', value: 'Topic' },
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

