<template>
  <div>
    <div class="flex items-center gap-2 sm:flex-row sm:items-center">
      <div class="min-w-0 flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchQueryModel"
          :placeholder="$t('authors_search_placeholder') as string"
          :aria-label="$t('authors_search_placeholder') as string"
          leading="i-ph-magnifying-glass"
          :trailing="searchQueryModel ? 'i-ph-x' : undefined"
          size="md"
          @input="$emit('search-input')"
          @trailing="searchQueryModel = ''; focus()"
          :una="{
            inputTrailing: 'pointer-events-auto cursor-pointer'
          }"
        />
      </div>
      <div class="hidden shrink-0 gap-2 md:flex">
        <NSelect
          v-model="sortByModel"
          :items="sortOptions"
          :placeholder="$t('authors_sort_name') as string"
          item-key="label"
          value-key="label"
          select="outline-gray"
          :_select-content="{ bodyLock: false }"
          @change="$emit('change-sort')"
        />
        <NButton
          icon
          :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          @click="$emit('toggle-sort-order')"
        />
      </div>
      <div class="shrink-0 md:hidden">
        <NButton
          icon
          label="i-ph-faders"
          size="sm"
          btn="outline-gray"
          :aria-label="$t('mobile.sort.open_filters') as string"
          @click="mobileFiltersOpenModel = true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

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
