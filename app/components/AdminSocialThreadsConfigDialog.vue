<template>
  <NDialog v-model:open="isOpen" scrollable>
    <template #header>
      <div class="p-2 space-y-1">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Threads API credentials</h3>
        <p class="text-sm text-gray-400 dark:text-gray-400">
          Store a Threads access token and user ID in KV so the provider can post without environment variables.
        </p>
      </div>
    </template>

    <div class="p-2 space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Threads Access Token</label>
        <NInput v-model="form.accessToken" type="password" placeholder="Leave blank to keep current token" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Current token: {{ state.hasAccessToken ? 'configured' : 'not configured' }} (source: {{ state.sources.accessToken }})
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Threads User ID</label>
        <NInput v-model="form.userId" placeholder="Leave empty to auto-detect from the token" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Source: {{ state.sources.userId }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Token status</p>
          <div class="mt-1 flex items-center gap-2">
            <NTooltip :content="state.hasAccessToken ? 'Token detected' : 'No token configured'">
            <NBadge :badge="'solid-' + tokenStatusColor" size="xs">{{ tokenStatusLabel }}</NBadge>
            </NTooltip>
          </div>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Resolved username</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ state.username || 'Unknown' }}</p>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Token expiry</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ formatExpiry(state.expiresAt) }}</p>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Token last updated</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ formatDate(state.tokenUpdatedAt) }}</p>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Refresh guidance</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ refreshGuidance }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Threads long-lived tokens are generally refreshable after 24 hours.
          </p>
          <div class="mt-2">
            <NButton
              btn="soft-gray"
              :disabled="!state.hasAccessToken"
              :loading="refreshing"
              class="w-full"
              @click="emit('refresh')"
            >
              Refresh token
            </NButton>
          </div>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">Effective redirect URI</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1 break-all">{{ state.redirectUri || 'Unknown' }}</p>
        </div>
      </div>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(state.updatedAt) }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton btn="link-gray" :disabled="saving" @click="isOpen = false">
          Cancel
        </NButton>
        <NButton btn="soft-blue" :loading="saving" @click="emit('save')">
          Save credentials
        </NButton>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import { formatDateTime, parseDateInput } from '~/utils/time-formatter'

interface Props {
  open: boolean
  form: {
    accessToken: string
    userId: string
  }
  state: {
    updatedAt: string | null
    hasAccessToken: boolean
    username: string
    expiresAt: string | null
    tokenUpdatedAt: string | null
    refreshAvailableAt: string | null
    canRefreshNow: boolean
    tokenStatus: 'missing' | 'expired' | 'expiring-soon' | 'healthy'
    redirectUri: string
    sources: {
      accessToken: 'kv' | 'env' | 'none'
      userId: 'kv' | 'env' | 'none'
    }
  }
  refreshing: boolean
  saving: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save'): void
  (e: 'refresh'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

function formatDate(value: string | null) {
  const formatted = formatDateTime(value)
  return formatted === 'N/A' ? 'Unknown' : formatted
}

function formatExpiry(value: string | null) {
  return formatDate(value)
}

function formatRelativeFuture(value: string | null) {
  const date = parseDateInput(value)
  if (!date) return 'Unknown'

  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) return 'Available now'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))

  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24)
    return diffDays === 1 ? 'in 1 day' : `in ${diffDays} days`
  }

  if (diffHours > 0) {
    return diffHours === 1 ? 'in 1 hour' : `in ${diffHours} hours`
  }

  return diffMinutes === 1 ? 'in 1 minute' : `in ${diffMinutes} minutes`
}

const tokenStatusLabel = computed(() => {
  if (props.state.tokenStatus === 'expired') return 'Expired'
  if (props.state.tokenStatus === 'expiring-soon') return 'Expiring soon'
  if (props.state.tokenStatus === 'healthy') return 'Healthy'
  return 'Missing'
})

const tokenStatusColor = computed(() => {
  if (props.state.tokenStatus === 'expired') return 'red'
  if (props.state.tokenStatus === 'expiring-soon') return 'yellow'
  if (props.state.tokenStatus === 'healthy') return 'green'
  return 'gray'
})

const refreshGuidance = computed(() => {
  if (!props.state.hasAccessToken) return 'No token to refresh'
  if (props.state.canRefreshNow) return 'Useful now'
  return formatRelativeFuture(props.state.refreshAvailableAt)
})
</script>