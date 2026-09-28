<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2 sm:flex-row sm:items-center">
      <div class="min-w-0 flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchQueryModel"
          :placeholder="$t('authors_search_placeholder') as string"
          :aria-label="$t('authors_search_placeholder') as string"
          leading="i-ph-magnifying-glass"
          size="md"
          @input="$emit('search-input')"
          :una="{
            inputTrailingWrapper: 'pointer-events-auto'
          }"
        >
          <template #trailing>
            <NTooltip v-if="searchQueryModel" :content="$t('components.search_box.clear_search') as string">
              <button
                type="button"
                :aria-label="$t('components.search_box.clear_search') as string"
                class="flex h-8 w-8 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-800 dark:hover:text-white dark:focus-visible:outline-gray-200"
                @click="searchQueryModel = ''; focus()"
              >
                <NIcon name="i-tabler-eraser" class="h-4 w-4" aria-hidden="true" />
              </button>
            </NTooltip>
          </template>
        </NInput>
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
        <NTooltip
          :content="$t(sortOrder === 'ASC' ? 'authors_sort_order_ascending' : 'authors_sort_order_descending') as string"
          :_tooltip-content="{ side: 'bottom' }"
        >
          <NButton
            icon
            :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
            :aria-label="$t(sortOrder === 'ASC' ? 'authors_sort_order_ascending' : 'authors_sort_order_descending') as string"
            btn="soft-gray"
            @click="$emit('toggle-sort-order')"
          />
        </NTooltip>
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

    <p
      role="status"
      aria-atomic="true"
      :aria-hidden="!showResultCount"
      :style="{ visibility: showResultCount ? 'visible' : 'hidden' }"
      class="h-4 font-sans text-xs leading-4 text-gray-500 dark:text-gray-400"
    >
      {{ $t(totalAuthors === 1 ? 'authors_results_count_one' : 'authors_results_count_other', { count: totalAuthors }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface Option { label: string; value: string }

const searchInput = ref<any>(null)

const props = withDefaults(defineProps<{
  authorsCount?: number
  totalAuthors?: number
  showResultCount?: boolean
  searchQuery?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  sortOptions?: Option[]
  mobileFiltersOpen?: boolean
}>(), {
  authorsCount: 0,
  totalAuthors: 0,
  showResultCount: false,
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
