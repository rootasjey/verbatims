<template>
  <NDrawer v-model:open="internalOpen" direction="bottom">
    <template #body>
      <div class="p-5 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{{ $t('mobile.sort_references.filters_sort') }}</h3>
          <NButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="internalOpen = false" />
        </div>

        <!-- Primary Type -->
        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.sort_references.type') }}</label>
          <NSelect
            v-model="internalPrimaryType"
            :items="typeOptions"
            :placeholder="$t('mobile.sort_references.all_types') as string"
            item-key="label"
            value-key="label"
          />
        </div>

        <!-- Sort By -->
        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.sort_references.sort_by') }}</label>
          <NSelect
            v-model="internalSortBy"
            :items="sortOptions"
            :placeholder="$t('mobile.sort_references.sort_by') as string"
            item-key="label"
            value-key="label"
          />
        </div>

        <!-- Order -->
        <div class="space-y-3">
          <label class="block font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('mobile.sort_references.order') }}</label>
          <div class="flex items-center gap-2">
            <NButton
              icon
              :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
              btn="soft-gray"
              size="sm"
              class="rounded-full"
              @click="$emit('toggle-sort-order')"
            />
            <span class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ sortOrder === 'ASC' ? $t('mobile.sort_references.ascending') : $t('mobile.sort_references.descending') }}</span>
          </div>
        </div>

        <div class="pt-1">
          <NButton btn="solid-black" class="w-full rounded-sm" size="sm" @click="internalOpen = false">
            {{ $t('mobile.sort_references.done') }}
          </NButton>
        </div>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface Option {
  label: string
  value: string
  [key: string]: unknown
}

const props = defineProps<{
  open: boolean
  sortBy: string
  primaryType: string
  sortOrder: 'ASC' | 'DESC' | string
  sortOptions: Option[]
  typeOptions: Option[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:sortBy', value: string): void
  (e: 'update:primaryType', value: string): void
  (e: 'update:sortOrder', value: 'ASC' | 'DESC' | string): void
  (e: 'toggle-sort-order'): void
}>()

const internalOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const internalSortBy = computed({
  get: () => props.sortOptions.find(option => option.value === props.sortBy) ?? props.sortOptions[0] ?? { label: '', value: '' },
  set: (option: Option) => emit('update:sortBy', option.value)
})

const internalPrimaryType = computed({
  get: () => props.typeOptions.find(option => option.value === props.primaryType) ?? props.typeOptions[0] ?? { label: '', value: '' },
  set: (option: Option) => emit('update:primaryType', option.value)
})

const sortOrder = computed(() => props.sortOrder)
</script>
