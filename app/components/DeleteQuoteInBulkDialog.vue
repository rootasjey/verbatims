<template>
  <AppDialog
    v-model="isOpen"
    :title="'Delete ' + selectedCount + ' ' + (selectedCount === 1 ? 'Draft' : 'Drafts')"
    submit-text="Delete All"
    :submitting="deleting"
    @submit="confirmDeletion"
  >
    <div class="space-y-4">
      <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-indigo-600 mt-0.5 mr-2" />
        <div class="text-sm text-indigo-800 dark:text-indigo-300">
          <p class="font-medium">This action is permanent.</p>
          <p class="mt-1">You are about to delete {{ selectedCount }} {{ selectedCount === 1 ? 'draft' : 'drafts' }}. This action cannot be undone.</p>
        </div>
      </div>

      <div v-if="selectedCount > 0 && selectedCount <= 3" class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <p class="font-medium mb-2">Quotes to be deleted:</p>
        <div v-for="quote in quotesToShow" :key="quote.id" class="border-l-2 border-gray-300 dark:border-gray-600 pl-3">
          <p class="italic font-serif text-xs">"{{ truncateText(quote.name, 100) }}"</p>
          <p v-if="quote.author || quote.reference" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span v-if="quote.author">— {{ quote.author.name }}</span>
            <span v-if="quote.author && quote.reference" class="mx-1">•</span>
            <span v-if="quote.reference">{{ quote.reference.name }}</span>
          </p>
        </div>
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-red" class="px-6" :loading="deleting" @click="confirmDeletion">Delete All</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  deleting: boolean
  selectedQuotes: (QuoteWithRelations | AdminQuote)[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'bulk-delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const selectedCount = computed(() => props.selectedQuotes.length)

const quotesToShow = computed(() => {
  return props.selectedQuotes.slice(0, 3)
})

const confirmDeletion = () => {
  emit('bulk-delete')
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>
