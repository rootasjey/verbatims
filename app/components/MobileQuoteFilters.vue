<template>
  <NDrawer v-model:open="openModel" direction="bottom">
    <template #body>
      <div class="p-5 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            {{ $t('mobile.quote_filters.title') }}
          </h2>
          <div class="flex items-center gap-2">
            <NButton
              v-if="hasActiveFilters"
              btn="ghost-gray"
              size="xs"
              @click="$emit('reset-filters')"
            >
              {{ $t('mobile.quote_filters.reset') }}
            </NButton>
            <NButton
              btn="ghost-gray"
              size="xs"
              icon
              label="i-ph-x-bold"
              :aria-label="$t('mobile.quote_filters.close') as string"
              @click="openModel = false"
            />
          </div>
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ $t('mobile.quote_filters.content_language') }}
          </label>
          <LanguageSelector
            :on-language-changed="handleLanguageChange"
            :aria-label="$t('mobile.quote_filters.content_language') as string"
          />
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ $t('desktop_quotes_grid.sort_by') }}
          </label>
          <NSelect
            v-model="sortByModel"
            :items="sortOptions"
            :placeholder="$t('desktop_quotes_grid.sort_by') as string"
            :_select-trigger="{ ariaLabel: $t('desktop_quotes_grid.sort_by') as string }"
            item-key="label"
            value-key="label"
            :_select-content="{ bodyLock: false }"
          />
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ $t('mobile.quote_filters.order') }}
          </label>
          <div class="flex items-center gap-3">
            <NButton
              icon
              :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
              :aria-label="$t(sortOrder === 'ASC' ? 'desktop_quotes_grid.sort_order_ascending' : 'desktop_quotes_grid.sort_order_descending') as string"
              btn="soft-gray"
              size="sm"
              @click="$emit('toggle-sort-order')"
            />
            <span class="font-sans text-sm text-gray-600 dark:text-gray-400">
              {{ $t(sortOrder === 'ASC' ? 'mobile.quote_filters.ascending' : 'mobile.quote_filters.descending') }}
            </span>
          </div>
        </div>

        <NButton btn="solid-black" class="w-full rounded-sm" size="sm" @click="openModel = false">
          {{ $t('mobile.quote_filters.done') }}
        </NButton>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface SortOption {
  label: string
  value: string
}

const props = defineProps<{
  open: boolean
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  sortOptions: SortOption[]
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'update:sortBy', value: string): void
  (event: 'toggle-sort-order'): void
  (event: 'language-changed'): void
  (event: 'reset-filters'): void
}>()

const openModel = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const sortByModel = computed({
  get: () => props.sortOptions.find(option => option.value === props.sortBy) ?? props.sortOptions[0],
  set: (option: SortOption | undefined) => {
    if (option) emit('update:sortBy', option.value)
  }
})

const handleLanguageChange = () => emit('language-changed')
</script>
