<template>
  <div class="mb-8">
    <span class="text-center font-sans font-600 block text-gray-600 dark:text-gray-400 mb-4">
      Showing {{ visibleCount }} of {{ totalCount }} references
    </span>

    <div class="flex sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchModel"
          placeholder="Search references..."
          leading="i-ph-magnifying-glass"
          size="md"
          class="focus:border-2 focus:border-lime-500"
        />
      </div>
      <div class="hidden md:flex gap-2">
        <NSelect
          v-model="primaryTypeModel"
          :items="typeOptions"
          placeholder="All Types"
          item-key="label"
          value-key="label"
        />
        <NSelect
          v-model="sortByModel"
          :items="sortOptions"
          placeholder="Sort by"
          item-key="label"
          value-key="label"
        />
        <NButton
          icon
          :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          @click="$emit('toggle-sort-order')"
        />
      </div>
      <div class="block md:hidden">
        <NButton btn="soft-gray" icon label="i-ph-funnel-simple" @click="$emit('open-mobile-filters')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option { label: string; value: string }

const searchInput = ref<any>(null)

const props = withDefaults(defineProps<{
  visibleCount?: number
  totalCount?: number
  searchQuery?: string
  primaryType?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  typeOptions?: Option[]
  sortOptions?: Option[]
}>(), {
  visibleCount: 0,
  totalCount: 0,
  searchQuery: '',
  primaryType: '',
  sortBy: 'name',
  sortOrder: 'ASC',
  typeOptions: () => [],
  sortOptions: () => []
})

const emit = defineEmits([
  'update:searchQuery',
  'update:primaryType',
  'update:sortBy',
  'toggle-sort-order',
  'open-mobile-filters'
])

const searchModel = computed({
  get: () => props.searchQuery as string,
  set: (v: string) => emit('update:searchQuery', v)
})

const primaryTypeModel = computed<Option | null>({
  get: () => (props.typeOptions as Option[]).find((o) => o.value === props.primaryType) || null,
  set: (opt: Option | null) => emit('update:primaryType', opt?.value || '')
})

const sortByModel = computed<Option | null>({
  get: () => (props.sortOptions as Option[]).find((o) => o.value === props.sortBy) || null,
  set: (opt: Option | null) => emit('update:sortBy', opt?.value || '')
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
