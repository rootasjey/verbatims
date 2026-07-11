<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('admin_social.manual_add') as string"
    hide-footer
    @close="isOpen = false"
  >
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <NInput
          v-model="searchModel"
          :placeholder="$t('admin_social.search_approved') as string"
          leading="i-ph-magnifying-glass"
          :loading="loading"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          @keyup.enter="emit('search')"
        />
        <NButton btn="soft-gray" :loading="loading" @click="emit('search')">{{ $t('admin_social.search_button') }}</NButton>
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
              {{ quote.author?.name || $t('common.unknown') }}
              <span v-if="quote.reference?.name"> · {{ quote.reference.name }}</span>
            </p>
          </div>
          <NButton btn="soft-blue" size="xs" @click="emit('add', quote.id)">{{ $t('admin_social.add_button') }}</NButton>
        </div>
        <p v-if="loaded && !quotes.length" class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('admin_social.no_approved_found') }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <NButton btn="link-gray" @click="isOpen = false">{{ $t('common.close') }}</NButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
const { $t } = useI18n()

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
