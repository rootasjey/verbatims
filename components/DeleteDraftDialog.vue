<template>
  <NDialog v-model:open="isOpen">
    <div>
      <h3 class="text-lg font-semibold">Delete Draft</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete this draft? This action cannot be undone.
      </p>
    </div>
    <template #footer>
      <div class="flex justify-end space-x-3">
        <NButton btn="link" @click="closeDialog">
          Cancel
        </NButton>
        <NButton
          btn="solid-red"
          :loading="deleting"
          class="px-8"
          @click="emit('delete-draft')"
        >
          Delete
        </NButton>
      </div>
    </template>
  </NDialog>
</template><template #footer>
      <div class="flex justify-end space-x-3">
        <NButton btn="link" @click="closeDialog">
          Cancel
        </NButton>
        <NButton
          btn="solid-red"
          :loading="deleting"
          class="px-8"
          @click="emit('delete-draft')"
        >
          Delete
        </NButton>
      </div>
    </template>
  </UDialog>
</template>

<script setup lang="ts">
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

const closeDialog = () => {
  isOpen.value = false
}
</script>
