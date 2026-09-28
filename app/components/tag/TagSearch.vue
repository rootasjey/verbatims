<template>
  <div class="space-y-2 pb-3">
    <div class="flex items-center gap-2 sm:gap-3">
      <div class="min-w-0 flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchQueryModel"
          :placeholder="$ts('tags_search_placeholder') as string"
          :aria-label="$ts('tags_search_placeholder') as string"
          leading="i-ph-magnifying-glass"
          :trailing="searchQueryModel ? 'i-tabler-eraser' : undefined"
          size="md"
          class="focus:border-gray-500 dark:focus:border-gray-400"
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
          :placeholder="$ts('tags_sort_name') as string"
          item-key="label"
          value-key="label"
          select="outline-gray"
          :_select-content="{ bodyLock: false }"
        />
        <NTooltip :content="$ts(sortOrder === 'ASC' ? 'tags_sort_order_ascending' : 'tags_sort_order_descending') as string" :_tooltip-content="{ side: 'bottom' }">
          <NButton
            icon
            :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
            :aria-label="$ts(sortOrder === 'ASC' ? 'tags_sort_order_ascending' : 'tags_sort_order_descending') as string"
            btn="soft-gray"
            @click="$emit('toggle-sort-order')"
          />
        </NTooltip>
      </div>
      <div class="shrink-0 md:hidden">
        <span class="relative inline-flex overflow-visible">
          <NButton
            icon
            label="i-ph-faders"
            size="sm"
            btn="outline-gray"
            :aria-label="$ts(hasActiveFilters ? 'tags_open_filters_active' : 'tags_open_filters') as string"
            @click="mobileFiltersOpenModel = true"
          />
          <span
            v-if="hasActiveFilters"
            class="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#FAFAF9] bg-gray-400 dark:border-[#0C0A09] dark:bg-gray-300"
            aria-hidden="true"
          />
        </span>
      </div>
    </div>

    <p
      role="status"
      aria-atomic="true"
      :aria-hidden="!showResultCount"
      :style="{ visibility: showResultCount ? 'visible' : 'hidden' }"
      class="h-4 font-sans text-xs leading-4 text-gray-500 dark:text-gray-400"
    >
      {{ $ts(totalTags === 1 ? 'tags_results_count_one' : 'tags_results_count_other', { count: totalTags }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { $ts } = useI18n()

interface Option { label: string; value: string }

const searchInput = ref<any>(null)

const props = withDefaults(defineProps<{
  tagsCount?: number
  totalTags?: number
  showResultCount?: boolean
  hasActiveFilters?: boolean
  searchQuery?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  sortOptions?: Option[]
  mobileFiltersOpen?: boolean
}>(), {
  tagsCount: 0,
  totalTags: 0,
  showResultCount: false,
  hasActiveFilters: false,
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
