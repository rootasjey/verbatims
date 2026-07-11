<template>
  <AppDialog
    v-model="isOpen"
    :title="(platformLabels[selectedPlatform] || $t('admin_social.provider_settings', { platform: selectedPlatform })) as string"
    :submitting="saving"
    :can-submit="editable"
    scrollable
    @submit="emit('save')"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      {{ $t('admin_social.provider_config_desc') }}
    </p>

    <div class="mx-1 space-y-6">
      <div>
        <CheckboxBadge v-model="form.enabled" :label="($t('admin_social.enable_posting', { platform: platformLabels[selectedPlatform] || selectedPlatform })) as string" />
        <p class="mt-1 ml-9 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('enabled') }}</p>
      </div>

      <template v-if="selectedPlatform === 'x'">
        <div>
          <PasswordInput v-model="form.oauth2AccessToken" :placeholder="($t('admin_social.x_access_token_placeholder')) as string" />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth2AccessToken') }}</p>
        </div>

        <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-blue" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('admin_social.advanced_api_params') }}</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-3 px-2 pb-2 pt-4 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <div>
                <CheckboxBadge v-model="form.requireMedia" :label="($t('admin_social.require_image')) as string" />
                <p class="ml-9 mt-1 text-xs text-gray-500 dark:text-gray-400">Require media source: {{ sourceLabel('requireMedia') }}</p>
              </div>

              <div>
                <NInput v-model="form.oauth1ConsumerKey" :placeholder="($t('admin_social.consumer_key_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                  <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.oauth1_consumer_key') }}</NBadge></template>
                </NInput>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1ConsumerKey') }}</p>
              </div>

              <div>
                <PasswordInput v-model="form.oauth1ConsumerSecret" :placeholder="($t('admin_social.consumer_secret_placeholder')) as string" />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1ConsumerSecret') }}</p>
              </div>

              <div>
                <PasswordInput v-model="form.oauth1AccessToken" :placeholder="($t('admin_social.oauth_access_token_placeholder')) as string" />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1AccessToken') }}</p>
              </div>

              <div>
                <PasswordInput v-model="form.oauth1AccessTokenSecret" :placeholder="($t('admin_social.oauth_access_token_secret_placeholder')) as string" />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1AccessTokenSecret') }}</p>
              </div>
            </div>
          </NCollapsibleContent>
        </NCollapsible>
      </template>

      <template v-else-if="selectedPlatform === 'bluesky'">
        <NInput v-model="form.identifier" :placeholder="($t('admin_social.bsky_handle_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
          <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.identifier_label') }}</NBadge></template>
        </NInput>
        <span class="ml-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('identifier') }}</span>

        <div>
          <PasswordInput v-model="form.password" :placeholder="($t('admin_social.bsky_password_placeholder')) as string" />
          <p class="mt-1 ml-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('password') }}</p>
        </div>

        <div>
          <NInput v-model="form.hashtags" :placeholder="($t('admin_social.hashtags_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
            <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.hashtags_label') }}</NBadge></template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('hashtags') }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('admin_social.hashtags_hint') }}</p>
        </div>

        <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-blue" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('admin_social.advanced_api_params') }}</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-2 px-2 pb-2 pt-2 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NInput v-model="form.service" :placeholder="($t('admin_social.bsky_service_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.atproto_service_url') }}</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('service') }}</p>
            </div>
          </NCollapsibleContent>
        </NCollapsible>
      </template>

      <template v-else-if="selectedPlatform === 'pinterest'">
        <div>
          <PasswordInput v-model="form.accessToken" :placeholder="($t('admin_social.pinterest_token_placeholder')) as string" />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('accessToken') }}</p>
        </div>

        <NCollapsible v-model:open="providerAccountOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-blue" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('admin_social.account_targeting') }}</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAccountOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-2 px-2 pb-2 pt-2 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NInput v-model="form.boardId" :placeholder="($t('admin_social.board_id_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.board_id') }}</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('boardId') }}</p>
            </div>
          </NCollapsibleContent>
        </NCollapsible>

        <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-blue" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('admin_social.advanced_api_params') }}</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-3 px-2 pb-2 pt-4 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NInput v-model="form.baseUrl" :placeholder="($t('admin_social.pinterest_base_url_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.base_url') }}</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('baseUrl') }}</p>

              <NInput v-model="form.apiVersion" :placeholder="($t('admin_social.api_version_placeholder')) as string" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.api_version') }}</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('apiVersion') }}</p>
            </div>
          </NCollapsibleContent>
        </NCollapsible>
      </template>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        {{ $t('admin_social.last_updated', { date: formatDate(state.updatedAt) }) }}
      </p>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import type { SocialPlatform } from '~~/shared/constants/social'
import { formatDateTime } from '~/utils/time-formatter'

const { $t } = useI18n()

interface ProviderConfigForm {
  enabled: boolean
  oauth2AccessToken: string
  oauth1ConsumerKey: string
  oauth1ConsumerSecret: string
  oauth1AccessToken: string
  oauth1AccessTokenSecret: string
  requireMedia: boolean
  service: string
  identifier: string
  password: string
  hashtags: string
  accessToken: string
  boardId: string
  baseUrl: string
  apiVersion: string
}

interface Props {
  open: boolean
  selectedPlatform: SocialPlatform
  platformLabels: Record<SocialPlatform, string>
  editable: boolean
  form: ProviderConfigForm
  state: {
    updatedAt: string | null
    sources: Record<string, 'kv' | 'env' | 'default' | 'none'>
  }
  loading: boolean
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

const providerAdvancedOpen = ref(false)
const providerAccountOpen = ref(false)

watch(() => props.open, (open) => {
  if (open) {
    providerAdvancedOpen.value = false
    providerAccountOpen.value = false
  }
})

function sourceLabel(field: string): string {
  return props.state.sources[field] || 'none'
}

function formatDate(value: string | null) {
  const formatted = formatDateTime(value)
  return formatted === 'N/A' ? 'Unknown' : formatted
}
</script>
