<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_draft') as string"
    :submitting="deleting"
    cancel-button-class="min-h-10"
    @submit="emit('delete-draft')"
  >
    <div class="space-y-4">
      <div class="space-y-1 border-l-2 border-stone-300 pl-4 dark:border-neutral-600">
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
      <NButton btn="solid-red" :disabled="deleting" :loading="deleting" class="min-h-10 rounded-0 px-3" @click="emit('delete-draft')">
        {{ $t('common.delete') }}
      </NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
</script>
