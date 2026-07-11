<template>
  <NDrawer v-model:open="openModel" direction="bottom">
    <template #body>
      <div class="p-5 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{{ $t('mobile.author_filters.filters') }}</h3>
          <NButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="openModel = false" />
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.author_filters.sort_by') }}</label>
          <NSelect
            v-model="sortByModel"
            :items="sortOptions"
            :placeholder="$t('mobile.author_filters.sort_by') as string"
            item-key="label"
            value-key="label"
          />
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.author_filters.language') }}</label>
          <LanguageSelector @language-changed="$emit('language-changed')" />
        </div>

        <div class="pt-2">
          <NButton btn="solid-black" class="w-full rounded-sm" size="sm" @click="openModel = false">
            {{ $t('mobile.author_filters.apply') }}
          </NButton>
        </div>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface SortOption { label: string; value: string }

const props = defineProps<{
  open?: boolean
  sortBy?: SortOption
  sortOptions: SortOption[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:sortBy', value: SortOption): void
  (e: 'language-changed'): void
}>()

const openModel = computed({
  get: () => !!props.open,
  set: (v: boolean) => emit('update:open', v)
})

const sortByModel = computed({
  get: () => props.sortBy as SortOption,
  set: (v: SortOption) => emit('update:sortBy', v)
})
</script>
