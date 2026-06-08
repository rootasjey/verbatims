<template>
  <AppDialog
    v-model="isOpen"
    title="Meta OAuth settings"
    submit-text="Save settings"
    :submitting="saving"
    scrollable
    @submit="emit('save')"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      Configure app credentials used by Reconnect Meta. Saved values are stored in KV and override env variables.
    </p>

    <div class="space-y-6">
      <NInput
        v-model="form.appId"
        placeholder="123456789012345"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Meta App ID</NBadge>
        </template>
      </NInput>

      <div>
        <NInput
          v-model="form.appSecret"
          type="password"
          placeholder="Leave blank to keep current secret"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputLeadingWrapper: 'pl-1.5' }"
        >
          <template #leading>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Meta App Secret</NBadge>
          </template>
        </NInput>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Current secret: {{ state.hasAppSecret ? 'configured' : 'not configured' }} (source: {{ state.sources.appSecret }})
        </p>
      </div>

      <NInput
        v-model="form.redirectUri"
        placeholder="https://your-domain.com/api/admin/social/meta/callback"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Redirect URI</NBadge>
        </template>
      </NInput>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(state.updatedAt) }}
      </p>
    </div>

    <template #submit>
      <NButton btn="soft-blue" :loading="saving" @click="emit('save')">Save settings</NButton>
    </template>
  </AppDialog>
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
