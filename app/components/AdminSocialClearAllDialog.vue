<template>
  <AppDialog
    v-model="isOpen"
    :title="'Clear all queue items'"
    :submitting="loading"
    @submit="emit('confirm')"
  >
    <p class="text-gray-600 dark:text-gray-400">
      Are you sure you want to remove <strong>all</strong> items from the queue for
      {{ platformLabels[selectedPlatform] || selectedPlatform }}? This
      action cannot be undone.
    </p>

    <template #submit>
      <NButton btn="soft-red" :loading="loading" @click="emit('confirm')">Clear all</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { SocialPlatform } from '~~/shared/constants/social'

interface Props {
  open: boolean
  loading: boolean
  selectedPlatform: SocialPlatform
  platformLabels: Record<SocialPlatform, string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})
</script>
