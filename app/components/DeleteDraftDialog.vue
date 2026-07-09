<template>
  <AppDialog
    v-model="isOpen"
    title="Delete Draft"
    :submitting="deleting"
    @submit="emit('delete-draft')"
  >
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Are you sure you want to delete this draft? This action cannot be undone.
    </p>

    <template #submit>
      <PrimaryButton :disabled="deleting" :loading="deleting" @click="emit('delete-draft')" class="rounded-0 px-3">
        <span class="flex items-center gap-2">
          Delete
          <NIcon v-if="!deleting" name="i-tabler-trash-filled" class="inline-block" />
        </span>
      </PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
