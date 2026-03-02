<template>
  <NDialog v-model:open="isOpen">
    <NCard class="border-none">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Manually add quote</h3>
      </template>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <NInput
            v-model="searchModel"
            placeholder="Search approved quotes..."
            leading="i-ph-magnifying-glass"
            :loading="loading"
            @keyup.enter="emit('search')"
          />
          <NButton btn="soft-gray" :loading="loading" @click="emit('search')">
            Search
          </NButton>
        </div>
        <div class="mt-3 max-h-44 overflow-auto space-y-2">
          <div
            v-for="quote in quotes"
            :key="quote.id"
            class="flex items-center justify-between gap-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2"
          >
            <div class="min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">{{ quote.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ quote.author?.name || 'Unknown author' }}
                <span v-if="quote.reference?.name"> · {{ quote.reference.name }}</span>
              </p>
            </div>
            <NButton btn="soft-blue" size="xs" @click="emit('add', quote.id)">
              Add
            </NButton>
          </div>
          <p v-if="loaded && !quotes.length" class="text-xs text-gray-500 dark:text-gray-400">
            No approved quote found.
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton btn="link-gray" @click="isOpen = false">Close</NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template>

<script setup lang="ts">
interface PickerQuote {
  id: number
  name: string
  author?: { name?: string }
  reference?: { name?: string }
}

interface Props {
  open: boolean
  loading: boolean
  loaded: boolean
  search: string
  quotes: PickerQuote[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:search', value: string): void
  (e: 'search'): void
  (e: 'add', quoteId: number): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value)
})
</script>