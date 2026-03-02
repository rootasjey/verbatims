<template>
  <NDialog v-model:open="isOpen">
    <NCard class="border-none">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Meta OAuth settings</h3>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Configure app credentials used by Reconnect Meta. Saved values are stored in KV and override env variables.
        </p>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Meta App ID</label>
          <NInput v-model="form.appId" placeholder="123456789012345" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Meta App Secret</label>
          <NInput v-model="form.appSecret" type="password" placeholder="Leave blank to keep current secret" />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Current secret: {{ state.hasAppSecret ? 'configured' : 'not configured' }} (source: {{ state.sources.appSecret }})
          </p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Redirect URI (optional)</label>
          <NInput v-model="form.redirectUri" placeholder="https://your-domain.com/api/admin/social/meta/callback" />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Leave empty to use {origin}/api/admin/social/meta/callback.
          </p>
        </div>

        <p v-if="state.updatedAt" class="text-xs text-gray-400">
          Last updated {{ formatDate(state.updatedAt) }}
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton btn="ghost" :disabled="saving" @click="isOpen = false">
            Cancel
          </NButton>
          <NButton btn="soft-blue" :loading="saving" @click="emit('save')">
            Save settings
          </NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template>

<script setup lang="ts">
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
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}
</script>
