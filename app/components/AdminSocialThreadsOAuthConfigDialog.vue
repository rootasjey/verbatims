<template>
  <NDialog v-model:open="isOpen" scrollable>
    <template #header>
      <div class="p-2 space-y-1">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Threads OAuth settings</h3>
        <p class="text-sm text-gray-400 dark:text-gray-400">
          Configure Threads app credentials used by Reconnect Threads. Saved values are stored in KV and override env variables.
        </p>
      </div>
    </template>

    <div class="p-2 space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Threads App ID</label>
        <NInput v-model="form.appId" placeholder="123456789012345" />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Threads App Secret</label>
        <NInput v-model="form.appSecret" type="password" placeholder="Leave blank to keep current secret" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Current secret: {{ state.hasAppSecret ? 'configured' : 'not configured' }} (source: {{ state.sources.appSecret }})
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Redirect URI (optional)</label>
        <NInput v-model="form.redirectUri" placeholder="https://your-domain.com/api/admin/social/threads/callback" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Leave empty to use {origin}/api/admin/social/threads/callback.
        </p>
      </div>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(state.updatedAt) }}
      </p>
    </div>

    <template #footer>
      <div class="p-2 flex justify-end gap-2">
        <NButton btn="link-gray" :disabled="saving" @click="isOpen = false">
          Cancel
        </NButton>
        <NButton btn="soft-blue" :loading="saving" @click="emit('save')">
          Save settings
        </NButton>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/time-formatter'

interface Props {
  open: boolean
  form: {
    appId: string
    appSecret: string
    redirectUri: string
  }
  state: {
    updatedAt: string | null
    hasAppSecret: boolean
    sources: {
      appSecret: 'kv' | 'env' | 'none'
    }
  }
  saving: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

function formatDate(value: string | null) {
  const formatted = formatDateTime(value)
  return formatted === 'N/A' ? 'Unknown' : formatted
}
</script>