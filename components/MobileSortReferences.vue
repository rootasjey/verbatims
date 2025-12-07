<template>
  <NDrawer v-model:open="internalOpen" direction="bottom">
    <template #body>
      <div class="p-4 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-serif text-lg font-600">Filters & Sort</h3>
          <NButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="internalOpen = false" />
        </div>

        <!-- Primary Type -->
        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Type</label>
          <NSelect
            v-model="internalPrimaryType"
            :items="typeOptions"
            placeholder="All Types"
            item-key="label"
            value-key="value"
          />
        </div>

        <!-- Sort By -->
        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Sort by</label>
          <NSelect
            v-model="internalSortBy"
            :items="sortOptions"
            placeholder="Sort by"
            item-key="label"
            value-key="label"
          />
        </div>

        <!-- Order -->
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
</template><template #body>
      <div class="p-4 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-serif text-lg font-600">Filters & Sort</h3>
          <NButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="internalOpen = false" />
        </div>

        <!-- Primary Type -->
        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Type</label>
          <NSelect
            v-model="internalPrimaryType"
            :items="typeOptions"
            placeholder="All Types"
            item-key="label"
            value-key="value"
          />
        </div>

        <!-- Sort By -->
        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Sort by</label>
          <NSelect
            v-model="internalSortBy"
            :items="sortOptions"
            placeholder="Sort by"
            item-key="label"
            value-key="label"
          />
        </div>

        <!-- Order -->
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
  </UDrawer>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value?: string
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
  get: () => props.sortBy,
  set: (v: string) => emit('update:sortBy', v)
})

const internalPrimaryType = computed({
  get: () => props.primaryType,
  set: (v: string) => emit('update:primaryType', v)
})

const sortOrder = computed(() => props.sortOrder)
</script>
