<template>
  <NDrawer v-model:open="internalOpen" direction="bottom">
    <template #body>
      <div class="p-5 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{{ $t('mobile.sort_authors.sort') }}</h3>
          <NButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="internalOpen = false" />
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.sort_authors.sort_by') }}</label>
          <NSelect
            v-model="internalSortOption"
            :items="sortOptions"
            :placeholder="$t('mobile.sort_authors.sort_by') as string"
            item-key="label"
            value-key="label"
          />
        </div>

        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.sort_authors.order') }}</label>
          <div class="flex items-center gap-2">
            <NButton
              icon
              :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
              btn="soft-gray"
              size="sm"
              class="rounded-full"
              @click="$emit('toggle-sort-order')"
            />
            <span class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ sortOrder === 'ASC' ? $t('mobile.sort_authors.ascending') : $t('mobile.sort_authors.descending') }}</span>
          </div>
        </div>

        <div class="pt-1">
          <NButton btn="solid-black" class="w-full rounded-sm" size="sm" @click="internalOpen = false">
            {{ $t('mobile.sort_authors.done') }}
          </NButton>
        </div>
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
  sortOrder: 'ASC' | 'DESC' | string
  sortOptions: SortOption[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:sortBy', value: string): void
  (e: 'update:sortOrder', value: 'ASC' | 'DESC' | string): void
  (e: 'toggle-sort-order'): void
}>()

const internalOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const internalSortOption = computed({
  get: () => props.sortOptions.find(o => o.value === props.sortBy) ?? props.sortOptions[0]!,
  set: (opt: SortOption) => emit('update:sortBy', opt.value)
})

// sortOrder is read-only here; toggling is delegated to parent via event
const sortOrder = computed(() => props.sortOrder)
</script>
