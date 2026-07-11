<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_draft') as string"
    :submitting="deleting"
    @submit="emit('delete-draft')"
  >
    <p class="text-sm text-gray-600 dark:text-gray-400">
      {{ $t('components.dialogs.confirm_delete') }} {{ $t('components.dialogs.confirm_delete_desc') }}
    </p>

    <template #submit>
      <PrimaryButton :disabled="deleting" :loading="deleting" @click="emit('delete-draft')" class="rounded-0 px-3">
        <span class="flex items-center gap-2">
          {{ $t('common.delete') }}
          <NIcon v-if="!deleting" name="i-tabler-trash-filled" class="inline-block" />
        </span>
      </PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { $t } = useI18n()

interface Props {
  open: boolean
  deleting: boolean
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
