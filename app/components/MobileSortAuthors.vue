<template>
  <NDrawer v-model:open="internalOpen" direction="bottom">
    <template #body>
      <div class="p-4 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-serif text-lg font-600">Sort</h3>
          <NButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="internalOpen = false" />
        </div>

        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Sort by</label>
          <NSelect
            v-model="internalSortOption"
            :items="sortOptions"
            placeholder="Sort by"
            item-key="label"
            value-key="label"
          />
        </div>

        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Order</label>
          <div class="flex items-center gap-2">
            <NButton
              icon
              :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
              btn="soft-gray"
              size="sm"
              class="rounded-full"
              @click="$emit('toggle-sort-order')"
            />
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ sortOrder === 'ASC' ? 'Ascending' : 'Descending' }}</span>
          </div>
        </div>

        <div class="pt-1">
          <NButton btn="solid-black" class="w-full rounded-3" size="sm" @click="internalOpen = false">
            Done
          </NButton>
        </div>
      </div>
    </template>
  </NDrawer>
  
</template>

<script setup lang="ts">
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

const internalSortOption = computed<SortOption>({
  get: () => props.sortOptions.find(o => o.value === props.sortBy) || props.sortOptions[0],
  set: (opt) => emit('update:sortBy', opt.value)
})

// sortOrder is read-only here; toggling is delegated to parent via event
const sortOrder = computed(() => props.sortOrder)
</script>
