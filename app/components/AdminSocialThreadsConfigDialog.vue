<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('admin_social.threads_credentials') as string"
    :submit-text="$t('admin_social.save_credentials') as string"
    :submitting="saving"
    scrollable
    max-width="lg"
    @submit="emit('save')"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      {{ $t('admin_social.threads_credentials_desc') }}
    </p>

    <div class="space-y-6">
      <div>
        <PasswordInput v-model="form.accessToken" :placeholder="$t('admin_social.threads_token_placeholder') as string" />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ $t('admin_social.current_token_status', { status: state.hasAccessToken ? ($t('admin_social.configured') as string) : ($t('admin_social.not_configured') as string), source: state.sources.accessToken }) }}
        </p>
      </div>

      <NInput
        v-model="form.userId"
        :placeholder="$t('admin_social.threads_userid_placeholder') as string"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.threads_user_id_badge') }}</NBadge>
        </template>
      </NInput>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.token_status') }}</p>
          <div class="mt-1 flex items-center gap-2">
            <NTooltip :content="(state.hasAccessToken ? $t('admin_social.token_detected') : $t('admin_social.no_token')) as string">
              <NBadge :badge="'solid-' + tokenStatusColor" size="xs">{{ tokenStatusLabel }}</NBadge>
            </NTooltip>
          </div>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.resolved_username') }}</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ state.username || $t('common.unknown') }}</p>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.token_expiry') }}</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ formatExpiry(state.expiresAt) }}</p>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.token_last_updated') }}</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ formatDate(state.tokenUpdatedAt) }}</p>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.refresh_guidance') }}</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ refreshGuidance }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ $t('admin_social.threads_refresh_hint') }}
          </p>
          <div class="mt-2">
            <NButton
              btn="soft-gray"
              :disabled="!state.hasAccessToken"
              :loading="refreshing"
              class="w-full"
              @click="emit('refresh')"
            >
              {{ $t('admin_social.refresh_token_button') }}
            </NButton>
          </div>
        </div>

        <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.effective_redirect_uri') }}</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1 break-all">{{ state.redirectUri || $t('common.unknown') }}</p>
        </div>
      </div>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        {{ $t('admin_social.last_updated', { date: formatDate(state.updatedAt) }) }}
      </p>
    </div>

  </AppDialog>
</template>

<script setup lang="ts">
import { formatDateTime, parseDateInput } from '~/utils/time-formatter'

const { $t } = useI18n()

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
  if (!date) return $t('common.unknown')

  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) return $t('admin_social.refresh_available_now')

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))

  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24)
    return $t('admin_social.in_days', { count: diffDays })
  }

  if (diffHours > 0) {
    return $t('admin_social.in_hours', { count: diffHours })
  }

  return $t('admin_social.in_minutes', { count: diffMinutes })
}

const tokenStatusLabel = computed(() => {
  if (props.state.tokenStatus === 'expired') return $t('admin_social.token_expired')
  if (props.state.tokenStatus === 'expiring-soon') return $t('admin_social.token_expiring_soon')
  if (props.state.tokenStatus === 'healthy') return $t('admin_social.token_healthy')
  return $t('admin_social.token_missing')
})

const tokenStatusColor = computed(() => {
  if (props.state.tokenStatus === 'expired') return 'red'
  if (props.state.tokenStatus === 'expiring-soon') return 'yellow'
  if (props.state.tokenStatus === 'healthy') return 'green'
  return 'gray'
})

const refreshGuidance = computed(() => {
  if (!props.state.hasAccessToken) return $t('admin_social.no_token_refresh')
  if (props.state.canRefreshNow) return $t('admin_social.refresh_available_now')
  return formatRelativeFuture(props.state.refreshAvailableAt)
})
</script>
