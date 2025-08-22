<template>
  <div class="font-serif mb-8">
    <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400 mb-4">
      Showing {{ authorsCount }} of {{ totalAuthors || 0 }} authors
    </span>

    <div class="flex sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1">
        <UInput
          autofocus
          ref="searchInput"
          v-model="searchQueryModel"
          placeholder="Search authors..."
          leading="i-ph-magnifying-glass"
          size="md"
          @input="$emit('search-input')"
          class="w-full"
        />
      </div>
      <div class="hidden md:flex gap-2">
        <USelect
          v-model="sortByModel"
          :items="sortOptions"
          placeholder="Sort by"
          item-key="label"
          value-key="label"
          @change="$emit('change-sort')"
        />
        <UButton
          icon
          :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          @click="$emit('toggle-sort-order')"
        />
      </div>
      <div class="block md:hidden">
        <UButton 
          icon 
          label="i-ph-faders" 
          size="sm" 
          btn="outline-gray" 
          class="rounded-full" 
          @click="mobileFiltersOpenModel = true" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  authorsCount: { type: Number, default: 0 },
  totalAuthors: { type: Number, default: 0 },
  searchQuery: { type: String, default: '' },
  sortBy: { type: String, default: 'name' },
  sortOrder: { type: String, default: 'ASC' },
  sortOptions: { type: Array, default: () => [] },
  mobileFiltersOpen: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:searchQuery',
  'update:sortBy',
  'update:mobileFiltersOpen',
  'toggle-sort-order',
  'change-sort',
  'search-input'
])

const searchQueryModel = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val)
})

const sortByModel = computed({
  get: () => props.sortBy,
  set: (val) => emit('update:sortBy', val)
})

const mobileFiltersOpenModel = computed({
  get: () => props.mobileFiltersOpen,
  set: (val) => emit('update:mobileFiltersOpen', val)
})
</script>
