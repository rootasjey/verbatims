<template>
  <div class="mb-8">
    <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400 mb-4">
      Showing {{ visibleCount }} of {{ totalCount }} references
    </span>

    <div class="flex sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1">
        <UInput
          v-model="searchModel"
          placeholder="Search references..."
          leading="i-ph-magnifying-glass"
          size="md"
          class="w-full"
        />
      </div>
      <div class="hidden md:flex gap-2">
        <USelect
          v-model="primaryTypeModel"
          :items="typeOptions"
          placeholder="All Types"
          item-key="label"
          value-key="value"
        />
        <USelect
          v-model="sortByModel"
          :items="sortOptions"
          placeholder="Sort by"
          item-key="label"
          value-key="value"
        />
        <UButton
          icon
          :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          @click="$emit('toggle-sort-order')"
        />
      </div>
      <div class="block md:hidden">
        <UButton btn="soft-gray" icon label="i-ph-funnel-simple" @click="$emit('open-mobile-filters')" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // counts
  visibleCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },

  // v-models
  searchQuery: { type: String, default: '' },
  primaryType: { type: String, default: '' },
  sortBy: { type: String, default: 'name' },

  // other controls
  sortOrder: { type: String, default: 'ASC' },
  typeOptions: { type: Array, default: () => [] },
  sortOptions: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:searchQuery',
  'update:primaryType',
  'update:sortBy',
  'toggle-sort-order',
  'open-mobile-filters'
])

const searchModel = computed({
  get: () => props.searchQuery,
  set: (v) => emit('update:searchQuery', v)
})

const primaryTypeModel = computed({
  get: () => props.primaryType,
  set: (v) => emit('update:primaryType', v)
})

const sortByModel = computed({
  get: () => props.sortBy,
  set: (v) => emit('update:sortBy', v)
})
</script>
