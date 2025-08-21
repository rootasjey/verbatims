<template>
  <UDrawer v-model:open="openModel" direction="bottom">
    <template #body>
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-serif text-lg font-600">Filters</h3>
          <UButton btn="ghost-gray" size="xs" icon label="i-ph-x-bold" @click="openModel = false" />
        </div>

        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Sort by</label>
          <USelect
            v-model="sortByModel"
            :items="sortOptions"
            placeholder="Sort by"
            item-key="label"
            value-key="label"
          />
        </div>

        <div class="space-y-3">
          <label class="block text-sm text-gray-600 dark:text-gray-300">Language</label>
          <LanguageSelector @language-changed="$emit('language-changed')" />
        </div>

        <div class="pt-2">
          <UButton btn="solid-black" class="w-full rounded-3" size="sm" @click="openModel = false">
            Apply
          </UButton>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
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
