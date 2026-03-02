<template>
  <NDialog v-model:open="isOpen">
    <NCard class="border-none">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add random quotes</h3>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Specify how many random approved quotes to enqueue.</p>
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Count</label>
          <NInput v-model="countModel" type="number" min="1" class="w-28" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton btn="link-gray" @click="isOpen = false">Cancel</NButton>
          <NButton btn="soft-blue" :loading="loading" @click="emit('confirm')">Add</NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  count: string
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:count', value: string): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const countModel = computed({
  get: () => props.count,
  set: (value: string) => emit('update:count', value)
})
</script>