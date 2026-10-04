<template>
  <NDrawer v-model:open="openModel" direction="bottom">
    <template #body>
      <div class="space-y-5 p-5 pb-7">
        <div class="flex items-center justify-between">
          <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
            {{ title || $t('mobile.quote_filters.title') }}
          </h2>
          <NButton icon btn="ghost-gray" size="xs" label="i-ph-x-bold" :aria-label="$t('common.close') as string" @click="openModel = false" />
        </div>

        <div v-if="sortOptions.length" class="space-y-2">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ $t('desktop_quotes_grid.sort_by') }}
          </label>
          <NSelect
            v-model="sortOptionModel"
            :items="normalizedSortOptions"
            item-key="label"
            value-key="label"
            :_select-content="{ bodyLock: false }"
          />
        </div>

        <div v-if="filterOptions.length" class="space-y-2">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ filterLabel }}
          </label>
          <NSelect
            v-model="filterOptionModel"
            :items="normalizedFilterOptions"
            item-key="label"
            value-key="label"
            :_select-content="{ bodyLock: false }"
          />
        </div>

        <div v-if="showLanguage" class="space-y-2">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ $t('mobile.quote_filters.content_language') }}
          </label>
          <LanguageSelector :on-language-changed="onLanguageChanged" />
        </div>

        <NButton btn="solid-black" class="w-full rounded-full" size="sm" @click="openModel = false">
          {{ $t('mobile.quote_filters.done') }}
        </NButton>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
interface SortOption { label: unknown; value: string; leading?: string }

const props = withDefaults(defineProps<{
  open: boolean
  sortValue?: string
  sortOptions?: SortOption[]
  title?: string
  filterLabel?: string
  filterValue?: string
  filterOptions?: SortOption[]
  showLanguage?: boolean
  onLanguageChanged?: () => void
}>(), {
  showLanguage: false,
  sortOptions: () => [],
  filterOptions: () => []
})

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'update:sortValue', value: string): void
  (event: 'update:filterValue', value: string): void
}>()

const { $t } = useI18n()
const openModel = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})
const normalizedSortOptions = computed(() => (props.sortOptions ?? []).map(option => ({ ...option, label: String(option.label ?? '') })))
const normalizedFilterOptions = computed(() => (props.filterOptions ?? []).map(option => ({ ...option, label: String(option.label ?? '') })))
const sortOptionModel = computed({
  get: () => normalizedSortOptions.value.find(option => option.value === props.sortValue) ?? normalizedSortOptions.value[0],
  set: (option: SortOption | undefined) => {
    if (option) emit('update:sortValue', option.value)
  }
})
const filterOptionModel = computed({
  get: () => normalizedFilterOptions.value.find(option => option.value === props.filterValue) ?? normalizedFilterOptions.value[0],
  set: (option: SortOption | undefined) => {
    if (option) emit('update:filterValue', option.value)
  }
})
</script>
