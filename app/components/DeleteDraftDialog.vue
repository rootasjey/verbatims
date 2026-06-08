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
      <NButton btn="soft-red" class="px-8" :loading="deleting" @click="emit('delete-draft')">Delete</NButton>
    </template>
  </AppDialog>
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
</script>
