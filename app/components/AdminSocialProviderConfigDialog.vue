<template>
  <AppDialog
    v-model="isOpen"
    :title="platformLabels[selectedPlatform] || selectedPlatform + ' provider settings'"
    :submitting="saving"
    :can-submit="editable"
    scrollable
    @submit="emit('save')"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      Saved values are stored in KV and override env variables. Leave a field empty to fall back to env / default.
    </p>

    <div class="space-y-6">
      <div>
        <NCheckbox
          v-model="form.enabled"
          :label="`Enable ${platformLabels[selectedPlatform] || selectedPlatform} posting`"
          checkbox="blue"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('enabled') }}</p>
      </div>

      <template v-if="selectedPlatform === 'x'">
        <div>
          <NInput
            input="outline-gray"
            v-model="form.oauth2AccessToken"
            type="password"
            placeholder="x-user-access-token"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputLeadingWrapper: 'pl-1.5' }"
          >
            <template #leading>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">OAuth 2.0 Access Token</NBadge>
            </template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth2AccessToken') }}</p>
        </div>

        <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-gray" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced API params</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-3 px-2 pb-2 pt-4 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NCheckbox v-model="form.requireMedia" label="Require image upload (fail if media upload fails)" checkbox="blue" />
              <p class="text-xs text-gray-500 dark:text-gray-400">Require media source: {{ sourceLabel('requireMedia') }}</p>

              <div>
                <NInput v-model="form.oauth1ConsumerKey" placeholder="consumer-key" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                  <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">OAuth 1.0a Consumer Key</NBadge></template>
                </NInput>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1ConsumerKey') }}</p>
              </div>

              <div>
                <NInput v-model="form.oauth1ConsumerSecret" type="password" placeholder="consumer-secret" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputLeadingWrapper: 'pl-1.5' }">
                  <template #leading><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">OAuth 1.0a Consumer Secret</NBadge></template>
                </NInput>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1ConsumerSecret') }}</p>
              </div>

              <div>
                <NInput v-model="form.oauth1AccessToken" type="password" placeholder="access-token" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputLeadingWrapper: 'pl-1.5' }">
                  <template #leading><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">OAuth 1.0a Access Token</NBadge></template>
                </NInput>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1AccessToken') }}</p>
              </div>

              <div>
                <NInput v-model="form.oauth1AccessTokenSecret" type="password" placeholder="access-token-secret" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputLeadingWrapper: 'pl-1.5' }">
                  <template #leading><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">OAuth 1.0a Token Secret</NBadge></template>
                </NInput>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1AccessTokenSecret') }}</p>
              </div>
            </div>
          </NCollapsibleContent>
        </NCollapsible>
      </template>

      <template v-else-if="selectedPlatform === 'bluesky'">
        <NInput v-model="form.identifier" placeholder="handle.bsky.social" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
          <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Identifier</NBadge></template>
        </NInput>
        <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('identifier') }}</p>

        <div>
          <NInput v-model="form.password" type="password" placeholder="bluesky-app-password" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputLeadingWrapper: 'pl-1.5' }">
            <template #leading><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">App Password</NBadge></template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('password') }}</p>
        </div>

        <div>
          <NInput v-model="form.hashtags" placeholder="#quotes #verbatims" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
            <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Hashtags</NBadge></template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('hashtags') }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Optional. Space or comma separated. Only the first 3 valid hashtags are used.</p>
        </div>

        <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-gray" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced API params</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-2 px-2 pb-2 pt-2 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NInput v-model="form.service" placeholder="https://bsky.social" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">ATProto Service URL</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('service') }}</p>
            </div>
          </NCollapsibleContent>
        </NCollapsible>
      </template>

      <template v-else-if="selectedPlatform === 'pinterest'">
        <div>
          <NInput v-model="form.accessToken" type="password" placeholder="pinterest-access-token" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputLeadingWrapper: 'pl-1.5' }">
            <template #leading><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Access Token</NBadge></template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('accessToken') }}</p>
        </div>

        <NCollapsible v-model:open="providerAccountOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-gray" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Account targeting</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAccountOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-2 px-2 pb-2 pt-2 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NInput v-model="form.boardId" placeholder="123456789012345678" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Board ID</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('boardId') }}</p>
            </div>
          </NCollapsibleContent>
        </NCollapsible>

        <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <NCollapsibleTrigger as-child class="w-full">
            <NButton btn="ghost-gray" class="px-2 w-full justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced API params</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="space-y-3 px-2 pb-2 pt-4 mt-2 border-t b-dashed border-gray-200 dark:border-gray-700">
              <NInput v-model="form.baseUrl" placeholder="https://api.pinterest.com" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Base URL</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('baseUrl') }}</p>

              <NInput v-model="form.apiVersion" placeholder="v5" class="bg-white dark:bg-gray-900 b-none shadow-none" :una="{ inputTrailingWrapper: 'pr-1.5' }">
                <template #trailing><NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">API Version</NBadge></template>
              </NInput>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('apiVersion') }}</p>
            </div>
          </NCollapsibleContent>
        </NCollapsible>
      </template>

      <p v-if="state.updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(state.updatedAt) }}
      </p>
    </div>

    <template #submit>
      <NButton btn="soft-blue" :loading="saving || loading" :disabled="!editable" @click="emit('save')">Save settings</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { SocialPlatform } from '~~/shared/constants/social'
import { formatDateTime } from '~/utils/time-formatter'

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
