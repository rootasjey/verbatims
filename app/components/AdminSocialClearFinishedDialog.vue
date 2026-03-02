<template>
  <NDialog v-model:open="isOpen">
    <NCard class="shadow-none border-none">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Clear finished queue items</h3>
      </template>
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Remove all items with status <em>posted</em> or <em>failed</em> for
          {{ platformLabels[selectedPlatform] || selectedPlatform }}? This will
          keep queued and processing entries intact.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="text-gray-600" @click="isOpen = false">Cancel</NButton>
          <NButton btn="link-red" :loading="loading" @click="emit('confirm')">Clear finished</NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
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
