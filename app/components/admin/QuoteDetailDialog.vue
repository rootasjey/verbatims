<template>
  <NDialog v-model:open="isOpen" :ui="{ width: 'max-w-2xl' }">
    <div v-if="quote" class="p-6">
      <blockquote class="font-body text-size-8 font-300 line-height-tight text-gray-900 dark:text-white leading-relaxed">
        {{ quote.name }}
      </blockquote>

      <!-- Author & Reference -->
      <div class="mt-6 flex flex-col gap-1 mb-6 border-t b-dashed border-gray-200 dark:border-gray-700 pt-6">
        <div v-if="quote.author" class="flex items-center gap-4">
          <NIcon name="i-ph-person-simple-walk" class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-900 dark:text-white">{{ quote.author.name }}</span>
          <NBadge v-if="quote.author.is_fictional" badge="soft-purple" size="xs">
            Fictional
          </NBadge>
        </div>

        <div v-if="quote.reference" class="flex items-center gap-4">
          <NIcon name="i-ph-book-open-text-duotone" class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-900 dark:text-white">{{ quote.reference.name }}</span>
        </div>

        <div v-if="quote.language" class="flex items-center gap-4">
          <NIcon name="i-ph-globe" class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-900 dark:text-white">{{ quote.language }}</span>
        </div>
      </div>

      <!-- Metadata Accordion -->
      <NAccordion :items="accordionItems" class="mb-6">
        <template #content="{ item }">
          <div class="space-y-3 text-sm p-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">Created by</span>
                <div class="mt-1">
                  <div class="text-xs text-gray-500 dark:text-blue" title="Email">{{ quote.user?.email }}</div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-900 dark:text-white" title="Username">{{ quote.user?.name }}</span>
                  </div>
                </div>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">Status</span>
                <div class="mt-1">
                  <NBadge badge="soft-gray" size="xs">
                    {{ quote.status || 'Draft' }}
                  </NBadge>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">Created at:</span>
                <div class="text-gray-900 dark:text-white mt-1">{{ formatRelativeTime(quote.created_at) }}</div>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">Updated at:</span>
                <div class="text-gray-900 dark:text-white mt-1">{{ formatRelativeTime(quote.updated_at) }}</div>
              </div>
            </div>
          </div>
        </template>
      </NAccordion>

      <!-- Actions -->
      <div class="mt-6 flex justify-end gap-2">
        <NButton btn="soft-blue" @click="$emit('edit', quote)">Edit</NButton>
        <NButton btn="ghost" @click="closeDialog">Close</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type { AdminQuote } from '~/types'
import { formatRelativeTime } from '~/utils/time-formatter'

interface Props {
  quote: AdminQuote | null
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'edit', quote: AdminQuote): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const closeDialog = () => {
  emit('update:open', false)
}

const accordionItems = computed(() => {
  if (!props.quote) return []
  
  return [
    {
      label: 'Metadata',
      defaultOpen: false,
      slot: 'metadata',
      content: props.quote.status || 'Draft',
    }
  ]
})
</script>
