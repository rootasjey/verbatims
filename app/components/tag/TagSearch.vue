<template>
  <div class="mb-8">
    <div class="flex sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchQueryModel"
          :placeholder="`Search among ${totalTags || 0} tags...`"
          leading="i-ph-magnifying-glass"
          :trailing="searchQueryModel ? 'i-ph-x' : undefined"
          size="md"
          class="focus:border-2 focus:border-lime-500"
          @input="$emit('search-input')"
          @trailing="searchQueryModel = ''; focus()"
          :una="{
            inputTrailing: 'pointer-events-auto cursor-pointer'
          }"
        />
      </div>
      <div class="hidden md:flex gap-2">
        <NSelect
          v-model="sortByModel"
          :items="sortOptions"
          placeholder="Sort by"
          item-key="label"
          value-key="label"
          select="outline-gray"
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
  tagsCount?: number
  totalTags?: number
  searchQuery?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  sortOptions?: Option[]
  mobileFiltersOpen?: boolean
}>(), {
  tagsCount: 0,
  totalTags: 0,
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

const sortByModel = computed({
  get: () => props.sortOptions.find(o => o.value === props.sortBy) ?? props.sortOptions[0] ?? { label: '', value: '' },
  set: (opt: Option) => emit('update:sortBy', opt.value)
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
