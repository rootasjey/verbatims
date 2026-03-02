<template>
  <NDialog v-model:open="isOpen">
    <NCard class="border-none">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ platformLabels[selectedPlatform] || selectedPlatform }} provider settings
        </h3>
      </template>

      <div v-if="editable" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Saved values are stored in KV and override env variables. Leave a field empty to fall back to env/default.
        </p>

        <div class="space-y-2">
          <NCheckbox
            v-model="form.enabled"
            :label="`Enable ${platformLabels[selectedPlatform] || selectedPlatform} posting`"
            checkbox="blue"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Source: {{ sourceLabel('enabled') }}
          </p>
        </div>

        <template v-if="selectedPlatform === 'x'">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">OAuth 2.0 User Access Token</label>
            <NInput v-model="form.oauth2AccessToken" type="password" placeholder="x-user-access-token" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth2AccessToken') }}</p>
          </div>

          <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <NCollapsibleTrigger as-child class="w-full">
              <NButton btn="ghost" class="w-full justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced API params</span>
                <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
              </NButton>
            </NCollapsibleTrigger>
            <NCollapsibleContent>
              <div class="space-y-3 px-2 pb-2">
                <NCheckbox
                  v-model="form.requireMedia"
                  label="Require image upload (fail if media upload fails)"
                  checkbox="blue"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400">Require media source: {{ sourceLabel('requireMedia') }}</p>

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">OAuth 1.0a Consumer Key</label>
                  <NInput v-model="form.oauth1ConsumerKey" placeholder="consumer-key" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1ConsumerKey') }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">OAuth 1.0a Consumer Secret</label>
                  <NInput v-model="form.oauth1ConsumerSecret" type="password" placeholder="consumer-secret" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1ConsumerSecret') }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">OAuth 1.0a Access Token</label>
                  <NInput v-model="form.oauth1AccessToken" type="password" placeholder="access-token" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1AccessToken') }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">OAuth 1.0a Access Token Secret</label>
                  <NInput v-model="form.oauth1AccessTokenSecret" type="password" placeholder="access-token-secret" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('oauth1AccessTokenSecret') }}</p>
                </div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
        </template>

        <template v-else-if="selectedPlatform === 'bluesky'">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Identifier</label>
            <NInput v-model="form.identifier" placeholder="handle.bsky.social" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('identifier') }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">App Password</label>
            <NInput v-model="form.password" type="password" placeholder="bluesky-app-password" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('password') }}</p>
          </div>

          <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <NCollapsibleTrigger as-child class="w-full">
              <NButton btn="ghost" class="w-full justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced API params</span>
                <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
              </NButton>
            </NCollapsibleTrigger>
            <NCollapsibleContent>
              <div class="space-y-2 px-2 pb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">ATProto Service URL</label>
                <NInput v-model="form.service" placeholder="https://bsky.social" />
                <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('service') }}</p>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
        </template>

        <template v-else-if="selectedPlatform === 'pinterest'">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Access Token</label>
            <NInput v-model="form.accessToken" type="password" placeholder="pinterest-access-token" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('accessToken') }}</p>
          </div>

          <NCollapsible v-model:open="providerAccountOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <NCollapsibleTrigger as-child class="w-full">
              <NButton btn="ghost" class="w-full justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Account targeting</span>
                <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAccountOpen }" />
              </NButton>
            </NCollapsibleTrigger>
            <NCollapsibleContent>
              <div class="space-y-2 px-2 pb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Board ID</label>
                <NInput v-model="form.boardId" placeholder="123456789012345678" />
                <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('boardId') }}</p>
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <NCollapsible v-model:open="providerAdvancedOpen" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <NCollapsibleTrigger as-child class="w-full">
              <NButton btn="ghost" class="w-full justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced API params</span>
                <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': providerAdvancedOpen }" />
              </NButton>
            </NCollapsibleTrigger>
            <NCollapsibleContent>
              <div class="space-y-3 px-2 pb-2">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Base URL</label>
                  <NInput v-model="form.baseUrl" placeholder="https://api.pinterest.com" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('baseUrl') }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">API Version</label>
                  <NInput v-model="form.apiVersion" placeholder="v5" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('apiVersion') }}</p>
                </div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
        </template>

        <p v-if="state.updatedAt" class="text-xs text-gray-400">
          Last updated {{ formatDate(state.updatedAt) }}
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton btn="link-gray" :disabled="saving" @click="isOpen = false">
            Cancel
          </NButton>
          <NButton btn="soft-blue" :loading="saving || loading" :disabled="!editable" @click="emit('save')">
            Save settings
          </NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template>

<script setup lang="ts">
import type { SocialPlatform } from '~~/shared/constants/social'

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
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}
</script>
