<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_draft') as string"
    :submitting="deleting"
    cancel-button-rounded="md"
    cancel-button-class="min-h-10 px-5 text-gray-700 transition-[transform] duration-150 hover:scale-[1.02] hover:bg-gray-100 active:scale-99 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 dark:text-gray-100 dark:hover:bg-neutral-800"
    close-button-class="bg-gray-100 transition-[transform] duration-150 hover:scale-[1.02] hover:bg-gray-200 active:scale-99 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
    @submit="emit('delete-draft')"
  >
    <div class="space-y-4">
      <div class="space-y-1 rounded-md border-l-2 border-stone-300 bg-gray-100/90 py-3 pr-4 pl-4 dark:border-neutral-600 dark:bg-neutral-800/70">
        <p class="line-clamp-2 whitespace-pre-line font-serif text-base leading-relaxed text-gray-900 dark:text-gray-100">
          “{{ props.quote?.name }}”
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">#{{ props.quote?.id }}</p>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('components.dialogs.delete_draft_warning') }}
      </p>
    </div>

    <template #submit>
      <NButton btn="solid-red" rounded="md" :disabled="deleting" :loading="deleting" class="min-h-10 px-5 text-white transition-[transform] duration-150 hover:scale-[1.02] active:scale-99 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100" style="background-color: #dc2626" @click="emit('delete-draft')">
        {{ $t('common.delete') }}
      </NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, watch } from 'vue'

const { $t } = useI18n()

interface Props {
  open: boolean
  deleting: boolean
  quote?: Pick<Quote, 'id' | 'name'> | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'delete-draft'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const handleDialogKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.repeat || props.deleting || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key !== 'Enter' && event.key !== ' ' && event.code !== 'Space') return

  const target = event.target
  if (!(target instanceof Element)) return

  const dialog = target.closest('[role="dialog"]')
  const deleteWarning = String($t('components.dialogs.delete_draft_warning'))
  if (!dialog?.textContent?.includes(deleteWarning)) return
  if (target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return

  event.preventDefault()
  emit('delete-draft')
}

watch(isOpen, async (open) => {
  if (!import.meta.client) return

  if (!open) {
    document.removeEventListener('keydown', handleDialogKeydown)
    return
  }

  await nextTick()
  if (props.open) document.addEventListener('keydown', handleDialogKeydown)
}, { flush: 'post' })

onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('keydown', handleDialogKeydown)
})
</script>
