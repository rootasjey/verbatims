<template>
  <AppDialog
    v-model="isOpen"
    title="Clear finished queue items"
    :submitting="loading"
    @submit="emit('confirm')"
  >
    <p class="text-gray-600 dark:text-gray-400">
      Remove all items with status <em>posted</em> or <em>failed</em> for
      {{ platformLabels[selectedPlatform] || selectedPlatform }}? This will
      keep queued and processing entries intact.
    </p>

    <template #submit>
      <NButton btn="soft-red" :loading="loading" @click="emit('confirm')">Clear finished</NButton>
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
