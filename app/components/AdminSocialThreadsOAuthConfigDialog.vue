<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('admin_social.threads_oauth_title') as string"
    :submit-text="$t('admin_social.save_settings') as string"
    :submitting="saving"
    scrollable
    @submit="emit('save')"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      {{ $t('admin_social.threads_oauth_desc') }}
    </p>

    <div class="space-y-6">
      <NInput
        v-model="form.appId"
        :placeholder="$t('admin_social.app_id_placeholder') as string"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.threads_app_id') }}</NBadge>
        </template>
      </NInput>

      <div>
        <PasswordInput v-model="form.appSecret" :placeholder="$t('admin_social.keep_secret_placeholder') as string" />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ $t('admin_social.current_secret', { status: state.hasAppSecret ? ($t('admin_social.configured') as string) : ($t('admin_social.not_configured') as string), source: state.sources.appSecret }) }}
        </p>
      </div>

      <NInput
        v-model="form.redirectUri"
        :placeholder="$t('admin_social.threads_redirect_placeholder') as string"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.redirect_uri') }}</NBadge>
        </template>
      </NInput>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        {{ $t('admin_social.last_updated', { date: formatDate(state.updatedAt) }) }}
      </p>
    </div>

  </AppDialog>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/time-formatter'

const { $t } = useI18n()

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
