<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2 sm:flex-row sm:items-center">
      <div class="min-w-0 flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchModel"
          :placeholder="$t('references_search_placeholder') as string"
          :aria-label="$t('references_search_placeholder') as string"
          leading="i-ph-magnifying-glass"
          :trailing="searchModel ? 'i-ph-x' : undefined"
          size="md"
          class="focus:border-2 focus:border-lime-500"
          @trailing="searchModel = ''; focus()"
          :una="{
            inputTrailing: 'pointer-events-auto cursor-pointer'
          }"
        />
      </div>
      <div class="hidden shrink-0 gap-2 md:flex">
        <NSelect
          v-model="primaryTypeModel"
          :items="typeOptions"
          :placeholder="typeOptions[0]?.label || ''"
          item-key="label"
          value-key="label"
          select="outline-gray"
          :_select-content="{ bodyLock: false }"
        />
        <NSelect
          v-model="sortByModel"
          :items="sortOptions"
          :placeholder="sortOptions[0]?.label || ''"
          item-key="label"
          value-key="label"
          select="outline-gray"
          :_select-content="{ bodyLock: false }"
        />
        <NTooltip
          :content="$t(sortOrder === 'ASC' ? 'references_sort_order_ascending' : 'references_sort_order_descending') as string"
          :_tooltip-content="{ side: 'bottom' }"
        >
          <NButton
            icon
            :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
            :aria-label="$t(sortOrder === 'ASC' ? 'references_sort_order_ascending' : 'references_sort_order_descending') as string"
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
          :aria-label="$t('mobile.sort_references.open_filters') as string"
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
      {{ $t(visibleCount === 1 ? 'references_results_count_one' : 'references_results_count_other', { count: visibleCount }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface Option { label: string; value: string }

const searchInput = ref<any>(null)

const props = withDefaults(defineProps<{
  visibleCount?: number
  showResultCount?: boolean
  searchQuery?: string
  primaryType?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  typeOptions?: Option[]
  sortOptions?: Option[]
  mobileFiltersOpen?: boolean
}>(), {
  visibleCount: 0,
  showResultCount: false,
  searchQuery: '',
  primaryType: '',
  sortBy: 'name',
  sortOrder: 'ASC',
  typeOptions: () => [],
  sortOptions: () => [],
  mobileFiltersOpen: false
})

const emit = defineEmits([
  'update:searchQuery',
  'update:primaryType',
  'update:sortBy',
  'toggle-sort-order',
  'update:mobileFiltersOpen'
])

const searchModel = computed({
  get: () => props.searchQuery as string,
  set: (v: string) => emit('update:searchQuery', v)
})

const primaryTypeModel = computed({
  get: () => (props.typeOptions as Option[]).find((o) => o.value === props.primaryType) ?? (props.typeOptions as Option[])[0] ?? { label: '', value: '' },
  set: (opt: Option) => emit('update:primaryType', opt.value)
})

const sortByModel = computed({
  get: () => (props.sortOptions as Option[]).find((o) => o.value === props.sortBy) ?? (props.sortOptions as Option[])[0] ?? { label: '', value: '' },
  set: (opt: Option) => emit('update:sortBy', opt.value)
})

const mobileFiltersOpenModel = computed({
  get: () => props.mobileFiltersOpen,
  set: (value: boolean) => emit('update:mobileFiltersOpen', value)
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
