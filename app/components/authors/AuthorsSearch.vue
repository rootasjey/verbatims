<template>
  <div class="mb-8">
    <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400 mb-4">
      Showing {{ authorsCount }} of {{ totalAuthors || 0 }} authors
    </span>

    <div class="flex sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchQueryModel"
          placeholder="Search authors..."
          leading="i-ph-magnifying-glass"
          size="md"
          @input="$emit('search-input')"
          class="focus:border-2 focus:border-lime-500"
        />
      </div>
      <div class="hidden md:flex gap-2">
        <NSelect
          v-model="sortByModel"
          :items="sortOptions"
          placeholder="Sort by"
          item-key="label"
          value-key="label"
          @change="$emit('change-sort')"
        />
        <NButton
          icon
          :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          @click="$emit('toggle-sort-order')"
        />
      </div>
      <div class="block md:hidden">
        <NButton 
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

<script setup lang="ts">
interface Option { label: string; value: string }

const searchInput = ref<any>(null)

const props = withDefaults(defineProps<{
  authorsCount?: number
  totalAuthors?: number
  searchQuery?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  sortOptions?: Option[]
  mobileFiltersOpen?: boolean
}>(), {
  authorsCount: 0,
  totalAuthors: 0,
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'ASC',
  sortOptions: () => [],
  mobileFiltersOpen: false
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
  set: (val: string) => emit('update:searchQuery', val)
})

const sortByModel = computed<Option | null>({
  get: () => (props.sortOptions).find(o => o.value === props.sortBy) || null,
  set: (opt: Option | null) => emit('update:sortBy', opt?.value || '')
})

const mobileFiltersOpenModel = computed({
  get: () => props.mobileFiltersOpen,
  set: (val: boolean) => emit('update:mobileFiltersOpen', val)
})

const focus = () => {
  const inputComponent = searchInput.value

  if (typeof inputComponent?.focus === 'function') {
    inputComponent.focus()
    return
  }

  const inputElement = inputComponent?.$el?.querySelector?.('input')
  if (inputElement instanceof HTMLElement) {
    inputElement.focus()
  }
}

const typeCharacter = (key: string) => {
  emit('update:searchQuery', `${props.searchQuery || ''}${key}`)
  nextTick(() => {
    focus()
  })
}

defineExpose({
  focus,
  typeCharacter
})
</script>
