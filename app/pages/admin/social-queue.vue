<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
        Social Queue
      </h1>
      <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">{{ totalItems }} item{{ totalItems !== 1 ? 's' : '' }}</p>

      <div class="flex flex-col sm:flex-row gap-3 mt-4">
        <div>
          <NToggleGroup
            v-model="safeSelectedPlatform"
            type="single"
            class="space-x-2 flex-wrap"
          >
            <NToggleGroupItem
              v-for="opt in platformOptions"
              :key="opt.value"
              :value="opt.value"
              size="sm"
              :class="[toggleItemColorClass(opt.value), {
                'w-auto px-4': opt.value === selectedPlatform,
                'max-w-full': opt.value === selectedPlatform
              }]"
            >
              <NIcon :name="opt.label" />
              <div v-if="opt.value === selectedPlatform" class="flex items-center gap-2">
                <span class="font-medium">
                  {{ SOCIAL_PLATFORM_LABELS[selectedPlatform] || selectedPlatform }}
                </span>

                <NTooltip>
                  <div class="flex items-center bg-gray-50 dark:bg-gray-800 p-.5 rounded-1">
                    <NIcon :name="getPlatformStatus(selectedPlatform).ok ? 'i-lucide-workflow' : 'i-lucide-traffic-cone'" />
                  </div>
                  <template #content>
                    <div>
                      {{ statusLabelFor(selectedPlatform) }}
                    </div>
                  </template>
                </NTooltip>

                <span>ID: {{ getPlatformStatus(selectedPlatform).account }}</span>
              </div>
            </NToggleGroupItem>
          </NToggleGroup>
        </div>
        <OutlinedButton :loading="providerCheckLoading" @click="checkProvider">Check provider</OutlinedButton>
        <OutlinedButton variant="primary" :loading="runNowLoading" @click="runNow">Run now</OutlinedButton>
        <NDropdownMenu :items="actionMenuItems">
          <button class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
        </NDropdownMenu>
      </div>
    </div>

    <div class="flex flex-col min-h-0">
      <!-- Skeleton -->
      <div v-if="loading && queueItems.length === 0" class="space-y-5">
        <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
          <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="queueItems.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
        <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">Queue is empty</p>
      </div>

      <!-- Table -->
      <div v-else>
        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
                <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Position</th>
                <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-4">
                    <span>Content</span>
                    <input v-model="searchQuery" type="text" placeholder="Search queue by content, author, reference..." class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-72" />
                  </div>
                </th>
                <th class="w-52 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-1">
                    <NTooltip :_tooltip-content="{ class: 'py-2 light:bg-gray-100 dark:bg-gray-950 light:b-gray-2 dark:b-gray-9 shadow-lg dark:shadow-gray-800/50' }">
                      <template #default>
                        <NIcon name="i-ph-info" class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer" />
                      </template>
                      <template #content>
                        <div class="space-y-1 font-sans text-xs">
                          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-gray-400" /> {{ stats.queued }} Queued</div>
                          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-yellow-500" /> {{ stats.processing }} Processing</div>
                          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500" /> {{ stats.posted }} Posted</div>
                          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500" /> {{ stats.failed }} Failed</div>
                        </div>
                      </template>
                    </NTooltip>
                    <select v-model="selectedStatus" class="font-sans text-xs bg-gray-100 dark:bg-gray-900 px-1.5 py-1 text-gray-700 dark:text-gray-300 cursor-pointer">
                      <option v-for="opt in statusOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
                    </select>
                  </div>
                </th>
                <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Posted Count</th>
                <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Posted</th>
                <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(item, idx) in queueItems" :key="item.id" class="animate-fade-in-up transition-colors group" :style="{ animationDelay: `${idx * 0.03}s` }">
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1.5">
                    <NLink v-if="hasPublishedPostUrl(item)" :to="item.published_post_url!" target="_blank" class="inline-flex items-center gap-1 font-sans text-sm text-green-700 dark:text-green-400 hover:underline">
                      <span>#{{ item.position }}</span><NIcon name="i-ph-link-simple" class="w-3 h-3" />
                    </NLink>
                    <span v-else class="font-sans text-sm text-gray-900 dark:text-gray-100">#{{ item.position }}</span>
                    <NTooltip v-if="hasPublishedPostUrl(item)">
                      <template #default><NIcon name="i-ph-check-circle" class="w-3.5 h-3.5 text-green-600 dark:text-green-400" /></template>
                      <template #content><span>Published post available</span></template>
                    </NTooltip>
                  </div>
                </td>
                <td class="px-3 py-3 max-w-md">
                  <div class="flex items-start gap-2">
                    <p class="font-sans text-sm text-gray-900 dark:text-gray-100 leading-relaxed flex-1">{{ getQueueItemPrimaryText(item) }}</p>
                    <NLink v-if="getQueueItemPath(item)" :to="getQueueItemPath(item)!" class="mt-0.5 inline-flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" :title="getQueueItemLinkLabel(item)">
                      <NIcon name="i-ph-arrow-up-right-duotone" class="w-4 h-4" />
                    </NLink>
                  </div>
                  <p v-if="getQueueItemSecondaryText(item)" class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">{{ getQueueItemSecondaryText(item) }}</p>
                  <p v-else class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatQueueSourceLabel(item) }}</p>
                </td>
                <td class="px-3 py-3">
                  <span class="font-sans text-xs px-1.5 py-0.5 cursor-pointer" :class="statusClass(item.status)" @click="copyErrorIfFailed(item)">
                    {{ item.status }}<span v-if="item.status === 'failed' && item.error_message"> &middot; {{ briefError(item.error_message) }}</span>
                  </span>
                </td>
                <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ item.quote_posts_count || 0 }}</td>
                <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatLastPosted(item.last_posted_at) }}</td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1">
                    <NDropdownMenu :items="tableHeaderMenuItems">
                      <button class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-list" class="w-4 h-4" /></button>
                    </NDropdownMenu>
                    <NDropdownMenu :items="rowActionItems(item)">
                      <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                    </NDropdownMenu>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalItems }} item{{ totalItems !== 1 ? 's' : '' }}</span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
        </div>
      </div>
      <div v-else class="pt-4 text-center">
        <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">No more pages to show</span>
        </div>
      </div>
    </div>

    <AdminSocialMetaConfigDialog
      :open="metaConfigDialogOpen"
      :form="metaConfigForm"
      :state="metaConfigState"
      :saving="metaConfigSaving"
      @update:open="metaConfigDialogOpen = $event"
      @save="saveMetaAppConfig"
    />

    <AdminSocialThreadsOAuthConfigDialog
      :open="threadsOAuthConfigDialogOpen"
      :form="threadsOAuthConfigForm"
      :state="threadsOAuthConfigState"
      :saving="threadsOAuthConfigSaving"
      @update:open="threadsOAuthConfigDialogOpen = $event"
      @save="saveThreadsOAuthConfig"
    />

    <AdminSocialProviderConfigDialog
      :open="providerConfigDialogOpen"
      :selected-platform="selectedPlatform"
      :platform-labels="SOCIAL_PLATFORM_LABELS"
      :editable="isEditableProvider(selectedPlatform)"
      :form="providerConfigForm"
      :state="providerConfigState"
      :loading="providerConfigLoading"
      :saving="providerConfigSaving"
      @update:open="providerConfigDialogOpen = $event"
      @save="saveProviderConfig"
    />

    <AdminSocialThreadsConfigDialog
      :open="threadsConfigDialogOpen"
      :form="threadsConfigForm"
      :state="threadsConfigState"
      :refreshing="threadsTokenRefreshLoading"
      :saving="threadsConfigSaving"
      @update:open="threadsConfigDialogOpen = $event"
      @refresh="refreshThreadsToken"
      @save="saveThreadsConfig"
    />

    <AdminSocialRandomAddDialog
      :open="randomDialogOpen"
      :count="randomCount"
      :loading="randomAdding"
      @update:open="randomDialogOpen = $event"
      @update:count="randomCount = $event"
      @confirm="addRandomQuotes(); randomDialogOpen = false"
    />

    <AdminSocialManualAddDialog
      :open="manualDialogOpen"
      :loading="pickerLoading"
      :loaded="pickerLoaded"
      :search="pickerSearch"
      :quotes="pickerQuotes"
      @update:open="manualDialogOpen = $event"
      @update:search="pickerSearch = $event"
      @search="loadQuotePicker"
      @add="addQuoteToQueue"
    />

    <AdminSocialClearAllDialog
      :open="showClearAllDialog"
      :loading="clearingAll"
      :selected-platform="selectedPlatform"
      :platform-labels="SOCIAL_PLATFORM_LABELS"
      @update:open="showClearAllDialog = $event"
      @confirm="clearAllQueue"
    />

    <AdminSocialClearFinishedDialog
      :open="showClearFinishedDialog"
      :loading="clearingFinished"
      :selected-platform="selectedPlatform"
      :platform-labels="SOCIAL_PLATFORM_LABELS"
      @update:open="showClearFinishedDialog = $event"
      @confirm="clearFinishedQueue"
    />
  </div>
</template>

<script setup lang="ts">
import type { SocialPlatform, SocialQueueStatus } from '~~/shared/constants/social'
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS, isSocialPlatform } from '~~/shared/constants/social'
import { watch, computed, onMounted } from 'vue'
import { useAdminSocialQueue } from '~/composables/useAdminSocialQueue'
import type { SocialQueueItem } from '~/composables/useAdminSocialQueue'
import { formatDate } from '~/utils/time-formatter'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Social Queue - Admin - Verbatims'
})

const { showErrorToast: showErrorToastFromComposable } = useErrorToast()

const providerCheckLoading = ref(false)
const metaStatusLoading = ref(false)
const metaConnectLoading = ref(false)
const metaConfigLoading = ref(false)
const metaConfigSaving = ref(false)
const metaConfigDialogOpen = ref(false)
const threadsOAuthConnectLoading = ref(false)
const threadsOAuthConfigLoading = ref(false)
const threadsOAuthConfigSaving = ref(false)
const threadsOAuthConfigDialogOpen = ref(false)
const providerConfigLoading = ref(false)
const providerConfigSaving = ref(false)
const providerConfigDialogOpen = ref(false)
const threadsTokenRefreshLoading = ref(false)
const threadsConfigSaving = ref(false)
const threadsConfigDialogOpen = ref(false)

// new dialogs for actions
const randomDialogOpen = ref(false)
const manualDialogOpen = ref(false)

// additional dialogs for bulk queue actions
const showClearAllDialog = ref(false)
const showClearFinishedDialog = ref(false)

const route = useRoute()

const {
  loading,
  randomAdding,
  runNowLoading,
  pickerLoading,
  pickerLoaded,
  clearingAll,
  clearingFinished,
  requeueFailedLoading,
  queueItems,
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  searchQuery,
  selectedStatus,
  statusOptions,
  selectedPlatform,
  platformOptions,
  randomCount,
  pickerSearch,
  pickerQuotes,
  stats,
  loadQueue,
  addRandomQuotes,
  runNow,
  loadQuotePicker,
  addQuoteToQueue,
  moveQueueItem,
  removeQueueItem,
  clearAllQueue: clearAllQueueRequest,
  clearFinishedQueue: clearFinishedQueueRequest,
  requeueFailedPosts,
  requeueSingleFailedItem
} = useAdminSocialQueue({
  showErrorToast
})


const safeSelectedPlatform = computed<SocialPlatform>({
  get: () => selectedPlatform.value,
  set: (val) => {
    if (isSocialPlatform(val)) {
      selectedPlatform.value = val
    }
  }
})
const metaConfigForm = reactive({
  appId: '',
  appSecret: '',
  redirectUri: ''
})

const metaConfigState = ref({
  updatedAt: '' as string | null,
  hasAppSecret: false,
  sources: {
    appId: 'none' as 'kv' | 'env' | 'none',
    appSecret: 'none' as 'kv' | 'env' | 'none',
    redirectUri: 'default' as 'kv' | 'env' | 'default'
  }
})

const threadsOAuthConfigForm = reactive({
  appId: '',
  appSecret: '',
  redirectUri: ''
})

const threadsOAuthConfigState = ref({
  updatedAt: '' as string | null,
  hasAppSecret: false,
  sources: {
    appId: 'none' as 'kv' | 'env' | 'none',
    appSecret: 'none' as 'kv' | 'env' | 'none',
    redirectUri: 'default' as 'kv' | 'env' | 'default'
  }
})

const threadsConfigForm = reactive({
  accessToken: '',
  userId: ''
})

const threadsConfigState = ref({
  updatedAt: '' as string | null,
  hasAccessToken: false,
  username: '',
  expiresAt: '' as string | null,
  tokenUpdatedAt: '' as string | null,
  refreshAvailableAt: '' as string | null,
  canRefreshNow: false,
  tokenStatus: 'missing' as 'missing' | 'expired' | 'expiring-soon' | 'healthy',
  redirectUri: '',
  sources: {
    accessToken: 'none' as 'kv' | 'env' | 'none',
    userId: 'none' as 'kv' | 'env' | 'none'
  }
})

const metaStatus = ref({
  updatedAt: '' as string | null,
  instagram: {
    connected: false,
    source: 'none',
    userId: '',
    username: '',
    expiresAt: '' as string | null
  },
  threads: {
    connected: false,
    source: 'none',
    userId: '',
    username: '',
    expiresAt: '' as string | null
  },
  facebook: {
    connected: false,
    source: 'none',
    pageId: '',
    pageName: ''
  }
})

// provider status cache used by non‑Meta platforms (and to track last check)
interface PlatformStatus {
  ok: boolean
  platform: SocialPlatform
  account?: string
  reason?: string
  loading: boolean
  lastChecked?: string
  expiresAt?: string | null
}

type EditableProvider = 'x' | 'bluesky' | 'pinterest' | 'instagram' | 'threads' | 'facebook'

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

type ProviderFieldSource = 'kv' | 'env' | 'default' | 'none'

interface ProviderConfigResponseData {
  platform: EditableProvider
  updatedAt: string | null
  values: Record<string, unknown>
  sources: Record<string, ProviderFieldSource>
}

interface DropdownMenuItem {
  label?: string
  leading?: string
  disabled?: boolean
  items?: DropdownMenuItem[]
  onclick?: () => void
}

type MetaPlatformKey = 'instagram' | 'threads' | 'facebook'
interface MetaUserStatus {
  connected: boolean
  userId: string
  username: string
  expiresAt: string | null
}

interface MetaFacebookStatus {
  connected: boolean
  pageId: string
  pageName: string
}

const providerStatus = reactive<Record<SocialPlatform, PlatformStatus>>(
  Object.fromEntries(
    SOCIAL_PLATFORMS.map(p => [p, { ok: false, platform: p as SocialPlatform, loading: false }])
  ) as Record<SocialPlatform, PlatformStatus>
)

const providerConfigForm = reactive<ProviderConfigForm>({
  enabled: false,
  oauth2AccessToken: '',
  oauth1ConsumerKey: '',
  oauth1ConsumerSecret: '',
  oauth1AccessToken: '',
  oauth1AccessTokenSecret: '',
  requireMedia: false,
  service: '',
  identifier: '',
  password: '',
  hashtags: '',
  accessToken: '',
  boardId: '',
  baseUrl: '',
  apiVersion: ''
})

const providerConfigState = reactive<{ updatedAt: string | null, sources: Record<string, ProviderFieldSource> }>({
  updatedAt: null,
  sources: {}
})

function isEditableProvider(platform: SocialPlatform): platform is EditableProvider {
  return platform === 'x'
    || platform === 'bluesky'
    || platform === 'pinterest'
    || platform === 'instagram'
    || platform === 'threads'
    || platform === 'facebook'
}

function isMetaPlatform(platform: SocialPlatform) {
  return platform === 'instagram' || platform === 'threads' || platform === 'facebook'
}

function getPlatformStatus(platform: SocialPlatform): PlatformStatus {
  // Guard against invalid platform values (e.g., null from toggle group)
  if (!isSocialPlatform(platform)) {
    return { ok: false, platform, loading: false, account: '' } as PlatformStatus
  }

  if (isMetaPlatform(platform)) {
    if (platform === 'facebook') {
      const m = metaStatus.value.facebook as MetaFacebookStatus
      return {
        ok: m.connected,
        platform,
        account: m.pageName || m.pageId || '',
        expiresAt: null,
        loading: providerStatus[platform]?.loading ?? false,
        lastChecked: providerStatus[platform]?.lastChecked
      } as PlatformStatus
    }

    const m = metaStatus.value[platform as Exclude<MetaPlatformKey, 'facebook'>] as MetaUserStatus

    return {
      ok: m.connected,
      platform,
      account: m.username || m.userId || '',
      expiresAt: m.expiresAt ?? null,
      loading: providerStatus[platform]?.loading ?? false,
      lastChecked: providerStatus[platform]?.lastChecked
    } as PlatformStatus
  }

  // non-Meta platform
  const status = providerStatus[platform]
  if (!status) {
    return { ok: false, platform, loading: false, account: '' } as PlatformStatus
  }
  return status
}

function statusColorFor(platform: SocialPlatform) {
  return getPlatformStatus(platform).ok ? 'green' : 'red'
}

const PLATFORM_TOGGLE_CLASS: Record<SocialPlatform, string> = {
  x: 'toggle-on-outline-blue toggle-off-outline-gray',
  bluesky: 'toggle-on-outline-green toggle-off-outline-gray',
  instagram: 'toggle-on-outline-pink toggle-off-outline-gray',
  threads: 'toggle-on-outline-gray toggle-off-outline-gray',
  facebook: 'toggle-on-outline-blue toggle-off-outline-gray',
  pinterest: 'toggle-on-outline-red toggle-off-outline-gray'
}

function toggleItemColorClass(platform: SocialPlatform) {
  if (!getPlatformStatus(platform).ok) {
    return 'toggle-on-outline-gray toggle-off-ghost-gray'
  }

  return PLATFORM_TOGGLE_CLASS[platform] || 'toggle-on-outline-gray toggle-off-outline-gray'
}

function statusLabelFor(platform: SocialPlatform) {
  const st = getPlatformStatus(platform)
  if (st.ok) return 'configured'
  if (st.reason) return 'error'
  return 'not configured'
}

function statusClass(status: SocialQueueStatus) {
  switch (status) {
    case 'queued': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'processing': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'posted': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'failed': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

function statusColor(status: SocialQueueStatus) {
  if (status === 'queued') return 'blue'
  if (status === 'processing') return 'yellow'
  if (status === 'posted') return 'green'
  return 'red'
}

function formatLastPosted(value: string | null) {
  if (!value) return 'Never'
  const formatted = formatDate(value)
  return formatted === 'N/A' ? 'Never' : formatted
}

function getQueueItemPrimaryText(item: SocialQueueItem) {
  return item.resolved_content?.primary_text || item.quote_text || 'No content available'
}

function getQueueItemSecondaryText(item: SocialQueueItem) {
  if (item.resolved_content?.secondary_text) {
    return item.resolved_content.secondary_text
  }

  const parts = [item.author_name || 'Unknown author', item.reference_name].filter(Boolean)
  return parts.length ? parts.join(' · ') : ''
}

function getQueueItemPath(item: SocialQueueItem) {
  return item.resolved_content?.canonical_path || (item.quote_id ? `/quotes/${item.quote_id}` : null)
}

function getQueueItemLinkLabel(item: SocialQueueItem) {
  return item.source_type === 'quote' ? 'Open quote page' : 'Open source page'
}

function formatQueueSourceLabel(item: SocialQueueItem) {
  return `${item.source_type} #${item.source_id}`
}

function hasPublishedPostUrl(item: SocialQueueItem) {
  return item.status === 'posted' && !!item.published_post_url
}

function openPublishedPost(item: SocialQueueItem) {
  if (!hasPublishedPostUrl(item) || typeof window === 'undefined') {
    return
  }

  window.open(item.published_post_url!, '_blank', 'noopener,noreferrer')
}

function briefError(message: string) {
  return message.length > 40 ? message.slice(0, 40) + '…' : message
}

async function copyErrorIfFailed(item: SocialQueueItem) {
  if (item.status !== 'failed' || !item.error_message) return
  try {
    await navigator.clipboard.writeText(item.error_message)
    useToast().toast({
      title: 'Copied',
      description: 'Error message copied to clipboard',
      toast: 'outline-success'
    })
  } catch {
    useToast().toast({
      title: 'Copy failed',
      description: 'Could not copy to clipboard',
      toast: 'outline-warning'
    })
  }
}

function showErrorToast(title: string, description: string) {
  showErrorToastFromComposable(null, { title, fallback: description })
}

function readErrorMessage(error: unknown, fallback: string) {
  const normalizedError = error as {
    data?: {
      statusMessage?: string
      message?: string
    }
    message?: string
  }

  const statusMessage = String(normalizedError?.data?.statusMessage || '')
  if (statusMessage) return statusMessage

  const dataMessage = String(normalizedError?.data?.message || '')
  if (dataMessage) return dataMessage

  const message = String(normalizedError?.message || '')
  if (message && message !== '[POST] "/api/admin/social/meta/connect-url": 500 Internal Server Error') {
    return message
  }

  return fallback
}

async function checkProvider() {
  providerCheckLoading.value = true
  try {
    await checkPlatform(selectedPlatform.value, true)
  } finally {
    providerCheckLoading.value = false
  }
}

async function checkPlatform(platform: SocialPlatform, showToasts = true) {
  const status = providerStatus[platform]
  status.loading = true
  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        ok: boolean
        platform: SocialPlatform
        account?: string
        reason?: string
      }
    }>('/api/admin/social-queue/provider-check', {
      method: 'POST',
      body: { platform }
    })

    const result = response?.data
    status.ok = !!result?.ok
    status.account = result?.account
    status.reason = result?.reason
    status.lastChecked = new Date().toISOString()

    if (isMetaPlatform(platform)) {
      await loadMetaStatus()
    }

    if (showToasts) {
      if (result?.ok) {
        if (result.account) {
          useToast().toast({
            title: 'Provider ready',
            description: `Connected as ${result.account}`,
            toast: 'outline-success'
          })
        } else {
          useToast().toast({
            title: 'Provider ready',
            description: 'Credentials look valid',
            toast: 'outline-success'
          })
        }
      } else {
        showErrorToast('Provider check failed', result?.reason || 'Credentials or permissions are invalid')
      }
    }
  } catch (error) {
    console.error(`Failed to check provider ${platform}:`, error)
    if (showToasts) showErrorToast('Error', 'Failed to run provider check')
  } finally {
    status.loading = false
  }
}

async function refreshAllStatuses() {
  // suppress toasts during bulk refresh
  await Promise.all(SOCIAL_PLATFORMS.map(p => checkPlatform(p as SocialPlatform, false)))
}

watch(selectedPlatform, (val) => {
  if (!isSocialPlatform(val)) return
  localStorage.setItem('admin_social_queue_platform', val)
  checkPlatform(val, false)
})

watch(manualDialogOpen, (open) => {
  if (!open) {
    pickerSearch.value = ''
    pickerQuotes.value = []
    pickerLoaded.value = false
  }
})

watch(randomDialogOpen, (open) => {
  if (!open) {
    randomCount.value = '5'
  }
})

const actionMenuItems = computed(() => {
  const items: DropdownMenuItem[] = []
  items.push({ label: 'Check provider', leading: 'i-ph-plugs-connected', onclick: checkProvider })
  if (selectedPlatform.value === 'threads') {
    items.push({ label: 'Provider settings', leading: 'i-ph-gear', onclick: openProviderConfigDialog })
    items.push({ label: 'Threads OAuth settings', leading: 'i-ph-sliders-horizontal', onclick: openThreadsOAuthConfigDialog })
    items.push({ label: 'Reconnect Threads', leading: 'i-ph-arrow-clockwise', onclick: connectThreads })
    items.push({ label: 'Threads API credentials', leading: 'i-ph-key', onclick: openThreadsConfigDialog })
  } else if (selectedPlatform.value === 'instagram' || selectedPlatform.value === 'facebook') {
    items.push({ label: 'Provider settings', leading: 'i-ph-gear', onclick: openProviderConfigDialog })
    items.push({ label: 'Meta OAuth settings', leading: 'i-ph-sliders-horizontal', onclick: openMetaConfigDialog })
    items.push({ label: 'Reconnect', leading: 'i-ph-arrow-clockwise', onclick: connectMeta })
  } else if (isEditableProvider(selectedPlatform.value)) {
    items.push({ label: 'Settings', leading: 'i-ph-gear', onclick: openProviderConfigDialog })
  }
  items.push({ label: 'Run now', leading: 'i-ph-play', onclick: runNow })
  items.push({})
  items.push({ label: 'Re-queue failed', leading: 'i-ph-arrow-counter-clockwise', onclick: () => requeueFailedPosts() })
  items.push({})
  items.push({ label: 'Add random (15)', leading: 'i-ph-shuffle', onclick: () => addRandomQuotes(15) })
  items.push({ label: 'Add random (custom)', leading: 'i-ph-shuffle', onclick: () => { randomCount.value = ''; randomDialogOpen.value = true } })
  items.push({ label: 'Manually add quotes', leading: 'i-ph-plus', onclick: () => { manualDialogOpen.value = true } })
  return items
})

// items for the tiny dropdown in table header
const tableHeaderMenuItems = computed(() => {
  const items: DropdownMenuItem[] = []
  items.push({ label: 'Clear all', onclick: () => { showClearAllDialog.value = true } })
  items.push({ label: 'Clear finished', onclick: () => { showClearFinishedDialog.value = true } })
  items.push({ label: 'Re-queue failed', leading: 'i-ph-arrow-counter-clockwise', onclick: () => requeueFailedPosts() })
  items.push({})
  items.push({ label: 'Add random (15)', leading: 'i-ph-shuffle', onclick: () => addRandomQuotes(15) })
  items.push({ label: 'Add random (custom)', leading: 'i-ph-shuffle', onclick: () => { randomCount.value = ''; randomDialogOpen.value = true } })
  items.push({ label: 'Manually add quotes', leading: 'i-ph-plus', onclick: () => { manualDialogOpen.value = true } })
  return items
})

// actions available for a specific queue row
function rowActionItems(item: SocialQueueItem) {
  const disabled = item.status !== 'queued'
  const actions: DropdownMenuItem[] = []
  const itemPath = getQueueItemPath(item)

  if (itemPath) {
    actions.push({
      label: getQueueItemLinkLabel(item),
      leading: 'i-ph-arrow-up-right-duotone',
      onclick: () => navigateTo(itemPath)
    })
  }
  if (hasPublishedPostUrl(item)) {
    actions.push({
      label: 'Open post',
      leading: 'i-ph-arrow-square-out',
      onclick: () => openPublishedPost(item)
    })
    actions.push({})
  }
  else if (itemPath) {
    actions.push({})
  }
  actions.push({
    label: 'Move up',
    leading: 'i-ph-caret-up',
    disabled,
    onclick: () => moveQueueItem(item.id, 'up')
  })
  actions.push({
    label: 'Move down',
    leading: 'i-ph-caret-down',
    disabled,
    onclick: () => moveQueueItem(item.id, 'down')
  })
  if (item.status === 'failed') {
    actions.push({})
    actions.push({
      label: 'Re-queue',
      leading: 'i-ph-arrow-counter-clockwise',
      onclick: () => requeueSingleFailedItem(item.id)
    })
  }
  actions.push({})
  actions.push({
    label: 'Remove',
    leading: 'i-ph-trash',
    onclick: () => removeQueueItem(item.id)
  })
  return actions
}

async function loadMetaStatus() {
  metaStatusLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        updatedAt: string | null
        instagram: {
          connected: boolean
          source: 'kv' | 'env' | 'none'
          userId: string
          username: string
          expiresAt: string | null
        }
        threads: {
          connected: boolean
          source: 'kv' | 'env' | 'none'
          userId: string
          username: string
          expiresAt: string | null
        }
        facebook: {
          connected: boolean
          source: 'kv' | 'env' | 'none'
          pageId: string
          pageName: string
          perms: string[]
        }
      }
    }>('/api/admin/social/meta/status')

    if (response?.data) {
      metaStatus.value = {
        updatedAt: response.data.updatedAt,
        instagram: {
          connected: response.data.instagram.connected,
          source: response.data.instagram.source,
          userId: response.data.instagram.userId,
          username: response.data.instagram.username,
          expiresAt: response.data.instagram.expiresAt
        },
        threads: {
          connected: response.data.threads.connected,
          source: response.data.threads.source,
          userId: response.data.threads.userId,
          username: response.data.threads.username,
          expiresAt: response.data.threads.expiresAt
        },
        facebook: {
          connected: response.data.facebook.connected,
          source: response.data.facebook.source,
          pageId: response.data.facebook.pageId,
          pageName: response.data.facebook.pageName
        }
      }
    }
  } catch (error) {
    console.error('Failed to load Meta status:', error)
    showErrorToast('Error', 'Failed to load Meta connection status')
  } finally {
    metaStatusLoading.value = false
  }
}

async function loadMetaAppConfig() {
  metaConfigLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        updatedAt: string | null
        appId: string
        redirectUri: string
        hasAppSecret: boolean
        sources: {
          appId: 'kv' | 'env' | 'none'
          appSecret: 'kv' | 'env' | 'none'
          redirectUri: 'kv' | 'env' | 'default'
        }
      }
    }>('/api/admin/social/meta/app-config')

    if (!response?.data) return

    metaConfigForm.appId = response.data.appId || ''
    metaConfigForm.appSecret = ''
    metaConfigForm.redirectUri = response.data.sources.redirectUri === 'default' ? '' : response.data.redirectUri

    metaConfigState.value = {
      updatedAt: response.data.updatedAt,
      hasAppSecret: response.data.hasAppSecret,
      sources: response.data.sources
    }
  } catch (error) {
    console.error('Failed to load Meta app config:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to load Meta OAuth settings'))
  } finally {
    metaConfigLoading.value = false
  }
}

async function openMetaConfigDialog() {
  await loadMetaAppConfig()
  metaConfigDialogOpen.value = true
}

async function loadThreadsOAuthConfig() {
  threadsOAuthConfigLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        updatedAt: string | null
        appId: string
        redirectUri: string
        hasAppSecret: boolean
        sources: {
          appId: 'kv' | 'env' | 'none'
          appSecret: 'kv' | 'env' | 'none'
          redirectUri: 'kv' | 'env' | 'default'
        }
      }
    }>('/api/admin/social/threads/app-config')

    if (!response?.data) return

    threadsOAuthConfigForm.appId = response.data.appId || ''
    threadsOAuthConfigForm.appSecret = ''
    threadsOAuthConfigForm.redirectUri = response.data.sources.redirectUri === 'default' ? '' : response.data.redirectUri

    threadsOAuthConfigState.value = {
      updatedAt: response.data.updatedAt,
      hasAppSecret: response.data.hasAppSecret,
      sources: response.data.sources
    }
  } catch (error) {
    console.error('Failed to load Threads OAuth config:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to load Threads OAuth settings'))
  } finally {
    threadsOAuthConfigLoading.value = false
  }
}

async function openThreadsOAuthConfigDialog() {
  await loadThreadsOAuthConfig()
  threadsOAuthConfigDialogOpen.value = true
}

async function loadThreadsConfig() {
  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        updatedAt: string | null
        userId: string
        username: string
        expiresAt: string | null
        tokenUpdatedAt: string | null
        refreshAvailableAt: string | null
        canRefreshNow: boolean
        tokenStatus: 'missing' | 'expired' | 'expiring-soon' | 'healthy'
        redirectUri: string
        hasAccessToken: boolean
        sources: {
          accessToken: 'kv' | 'env' | 'none'
          userId: 'kv' | 'env' | 'none'
        }
      }
    }>('/api/admin/social/threads/credentials')

    if (!response?.data) return

    threadsConfigForm.accessToken = ''
    threadsConfigForm.userId = response.data.userId || ''
    threadsConfigState.value = {
      updatedAt: response.data.updatedAt,
      hasAccessToken: response.data.hasAccessToken,
      username: response.data.username || '',
      expiresAt: response.data.expiresAt,
      tokenUpdatedAt: response.data.tokenUpdatedAt,
      refreshAvailableAt: response.data.refreshAvailableAt,
      canRefreshNow: response.data.canRefreshNow,
      tokenStatus: response.data.tokenStatus,
      redirectUri: response.data.redirectUri,
      sources: response.data.sources
    }
  } catch (error) {
    console.error('Failed to load Threads credentials:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to load Threads API credentials'))
  }
}

async function openThreadsConfigDialog() {
  await loadThreadsConfig()
  threadsConfigDialogOpen.value = true
}

function resetProviderConfigForm() {
  providerConfigForm.enabled = false
  providerConfigForm.oauth2AccessToken = ''
  providerConfigForm.oauth1ConsumerKey = ''
  providerConfigForm.oauth1ConsumerSecret = ''
  providerConfigForm.oauth1AccessToken = ''
  providerConfigForm.oauth1AccessTokenSecret = ''
  providerConfigForm.requireMedia = false
  providerConfigForm.service = ''
  providerConfigForm.identifier = ''
  providerConfigForm.password = ''
  providerConfigForm.hashtags = ''
  providerConfigForm.accessToken = ''
  providerConfigForm.boardId = ''
  providerConfigForm.baseUrl = ''
  providerConfigForm.apiVersion = ''
}

function applyProviderConfigResponse(data: ProviderConfigResponseData) {
  const values = data.values || {}

  providerConfigForm.enabled = Boolean(values.enabled)
  providerConfigForm.oauth2AccessToken = String(values.oauth2AccessToken || '')
  providerConfigForm.oauth1ConsumerKey = String(values.oauth1ConsumerKey || '')
  providerConfigForm.oauth1ConsumerSecret = String(values.oauth1ConsumerSecret || '')
  providerConfigForm.oauth1AccessToken = String(values.oauth1AccessToken || '')
  providerConfigForm.oauth1AccessTokenSecret = String(values.oauth1AccessTokenSecret || '')
  providerConfigForm.requireMedia = Boolean(values.requireMedia)
  providerConfigForm.service = String(values.service || '')
  providerConfigForm.identifier = String(values.identifier || '')
  providerConfigForm.password = String(values.password || '')
  providerConfigForm.hashtags = String(values.hashtags || '')
  providerConfigForm.accessToken = String(values.accessToken || '')
  providerConfigForm.boardId = String(values.boardId || '')
  providerConfigForm.baseUrl = String(values.baseUrl || '')
  providerConfigForm.apiVersion = String(values.apiVersion || '')

  providerConfigState.updatedAt = data.updatedAt || null
  providerConfigState.sources = data.sources || {}
}

async function loadProviderConfig(platform: EditableProvider) {
  providerConfigLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: ProviderConfigResponseData
    }>(`/api/admin/social/providers/${platform}`)

    if (response?.data) {
      applyProviderConfigResponse(response.data)
    }
  } catch (error) {
    console.error(`Failed to load provider settings for ${platform}:`, error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to load provider settings'))
  } finally {
    providerConfigLoading.value = false
  }
}

async function openProviderConfigDialog() {
  if (!isEditableProvider(selectedPlatform.value)) {
    useToast().toast({
      title: 'Unsupported provider',
      description: 'Settings are currently editable only for implemented providers',
      toast: 'outline-warning'
    })
    return
  }

  resetProviderConfigForm()
  await loadProviderConfig(selectedPlatform.value)
  providerConfigDialogOpen.value = true
}

async function saveProviderConfig() {
  if (!isEditableProvider(selectedPlatform.value)) {
    return
  }

  providerConfigSaving.value = true

  try {
    const body: Record<string, string | boolean> = {
      enabled: providerConfigForm.enabled
    }

    if (selectedPlatform.value === 'x') {
      body.oauth2AccessToken = providerConfigForm.oauth2AccessToken
      body.oauth1ConsumerKey = providerConfigForm.oauth1ConsumerKey
      body.oauth1ConsumerSecret = providerConfigForm.oauth1ConsumerSecret
      body.oauth1AccessToken = providerConfigForm.oauth1AccessToken
      body.oauth1AccessTokenSecret = providerConfigForm.oauth1AccessTokenSecret
      body.requireMedia = providerConfigForm.requireMedia
    }

    if (selectedPlatform.value === 'bluesky') {
      body.service = providerConfigForm.service
      body.identifier = providerConfigForm.identifier
      body.password = providerConfigForm.password
      body.hashtags = providerConfigForm.hashtags
    }

    if (selectedPlatform.value === 'pinterest') {
      body.accessToken = providerConfigForm.accessToken
      body.boardId = providerConfigForm.boardId
      body.baseUrl = providerConfigForm.baseUrl
      body.apiVersion = providerConfigForm.apiVersion
    }

    const response = await $fetch<{
      success: boolean
      data?: ProviderConfigResponseData
    }>(`/api/admin/social/providers/${selectedPlatform.value}`, {
      method: 'POST',
      body
    })

    if (response?.data) {
      applyProviderConfigResponse(response.data)
    }

    providerConfigDialogOpen.value = false

    useToast().toast({
      title: 'Saved',
      description: `${SOCIAL_PLATFORM_LABELS[selectedPlatform.value] || selectedPlatform.value} settings updated`,
      toast: 'outline-success'
    })

    await checkPlatform(selectedPlatform.value, false)
  } catch (error) {
    console.error(`Failed to save provider settings for ${selectedPlatform.value}:`, error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to save provider settings'))
  } finally {
    providerConfigSaving.value = false
  }
}

async function saveMetaAppConfig() {
  metaConfigSaving.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        appId: string
        redirectUri: string
        hasAppSecret: boolean
        sources: {
          appId: 'kv' | 'env' | 'none'
          appSecret: 'kv' | 'env' | 'none'
          redirectUri: 'kv' | 'env' | 'default'
        }
      }
    }>('/api/admin/social/meta/app-config', {
      method: 'POST',
      body: {
        appId: metaConfigForm.appId,
        appSecret: metaConfigForm.appSecret,
        redirectUri: metaConfigForm.redirectUri
      }
    })

    if (response?.data) {
      metaConfigState.value = {
        updatedAt: new Date().toISOString(),
        hasAppSecret: response.data.hasAppSecret,
        sources: response.data.sources
      }

      metaConfigForm.appSecret = ''
      metaConfigDialogOpen.value = false

      useToast().toast({
        title: 'Saved',
        description: 'Meta OAuth settings updated',
        toast: 'outline-success'
      })
    }
  } catch (error) {
    console.error('Failed to save Meta app config:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to save Meta OAuth settings'))
  } finally {
    metaConfigSaving.value = false
  }
}

async function saveThreadsOAuthConfig() {
  threadsOAuthConfigSaving.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        appId: string
        redirectUri: string
        hasAppSecret: boolean
        sources: {
          appId: 'kv' | 'env' | 'none'
          appSecret: 'kv' | 'env' | 'none'
          redirectUri: 'kv' | 'env' | 'default'
        }
      }
    }>('/api/admin/social/threads/app-config', {
      method: 'POST',
      body: {
        appId: threadsOAuthConfigForm.appId,
        appSecret: threadsOAuthConfigForm.appSecret,
        redirectUri: threadsOAuthConfigForm.redirectUri
      }
    })

    if (response?.data) {
      threadsOAuthConfigState.value = {
        updatedAt: new Date().toISOString(),
        hasAppSecret: response.data.hasAppSecret,
        sources: response.data.sources
      }

      threadsOAuthConfigForm.appSecret = ''
      threadsOAuthConfigDialogOpen.value = false

      useToast().toast({
        title: 'Saved',
        description: 'Threads OAuth settings updated',
        toast: 'outline-success'
      })
    }
  } catch (error) {
    console.error('Failed to save Threads OAuth config:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to save Threads OAuth settings'))
  } finally {
    threadsOAuthConfigSaving.value = false
  }
}

async function saveThreadsConfig() {
  threadsConfigSaving.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        userId: string
        username: string
        expiresAt: string | null
        tokenUpdatedAt: string | null
        hasAccessToken: boolean
        sources: {
          accessToken: 'kv' | 'env' | 'none'
          userId: 'kv' | 'env' | 'none'
        }
      }
    }>('/api/admin/social/threads/credentials', {
      method: 'POST',
      body: {
        accessToken: threadsConfigForm.accessToken,
        userId: threadsConfigForm.userId
      }
    })

    if (response?.data) {
      threadsConfigForm.accessToken = ''
      threadsConfigForm.userId = response.data.userId || threadsConfigForm.userId
      threadsConfigDialogOpen.value = false

      useToast().toast({
        title: 'Saved',
        description: 'Threads API credentials updated',
        toast: 'outline-success'
      })

      await loadThreadsConfig()
      await loadMetaStatus()
      await checkPlatform('threads', false)
    }
  } catch (error) {
    console.error('Failed to save Threads credentials:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to save Threads API credentials'))
  } finally {
    threadsConfigSaving.value = false
  }
}

async function refreshThreadsToken() {
  threadsTokenRefreshLoading.value = true

  try {
    await $fetch('/api/admin/social/threads/refresh-token', {
      method: 'POST'
    })

    useToast().toast({
      title: 'Token refreshed',
      description: 'Threads long-lived token refreshed successfully',
      toast: 'outline-success'
    })

    await loadThreadsConfig()
    await loadMetaStatus()
    await checkPlatform('threads', false)
  } catch (error) {
    console.error('Failed to refresh Threads token:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to refresh Threads token'))
  } finally {
    threadsTokenRefreshLoading.value = false
  }
}

async function connectMeta() {
  metaConnectLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        authUrl: string
      }
    }>('/api/admin/social/meta/connect-url', {
      method: 'POST',
      body: {
        returnPath: '/admin/social-queue'
      }
    })

    const authUrl = response?.data?.authUrl
    if (!authUrl) {
      throw new Error('Missing auth URL')
    }

    if (typeof window !== 'undefined') {
      window.location.assign(authUrl)
    }
  } catch (error) {
    console.error('Failed to start Meta OAuth:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to start Meta OAuth flow'))
  } finally {
    metaConnectLoading.value = false
  }
}

async function connectThreads() {
  threadsOAuthConnectLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data?: {
        authUrl: string
      }
    }>('/api/admin/social/threads/connect-url', {
      method: 'POST',
      body: {
        returnPath: '/admin/social-queue'
      }
    })

    const authUrl = response?.data?.authUrl
    if (!authUrl) {
      throw new Error('Missing auth URL')
    }

    if (typeof window !== 'undefined') {
      window.location.assign(authUrl)
    }
  } catch (error) {
    console.error('Failed to start Threads OAuth:', error)
    showErrorToast('Error', readErrorMessage(error, 'Failed to start Threads OAuth flow'))
  } finally {
    threadsOAuthConnectLoading.value = false
  }
}

async function clearAllQueue() {
  await clearAllQueueRequest()
  showClearAllDialog.value = false
}

async function clearFinishedQueue() {
  await clearFinishedQueueRequest()
  showClearFinishedDialog.value = false
}

onMounted(async () => {
  const savedPlatform = localStorage.getItem('admin_social_queue_platform')
  if (savedPlatform && isSocialPlatform(savedPlatform)) {
    selectedPlatform.value = savedPlatform
  }

  await loadQueue()
  await loadMetaStatus()
  await refreshAllStatuses()

  const connectResult = String(route.query.metaConnect || '')
  const threadsConnectResult = String(route.query.threadsConnect || '')

  if (connectResult) {
    if (connectResult === 'ok') {
      useToast().toast({
        title: 'Meta connected',
        description: 'Instagram, Threads, and Facebook credentials were refreshed successfully',
        toast: 'outline-success'
      })
    } else {
      const reason = String(route.query.metaReason || 'Meta OAuth failed')
      let readableReason = reason
      try {
        readableReason = decodeURIComponent(reason)
      } catch {
        readableReason = reason
      }

      showErrorToast('Meta connection failed', readableReason)
    }
  }

  if (threadsConnectResult) {
    if (threadsConnectResult === 'ok') {
      useToast().toast({
        title: 'Threads connected',
        description: 'Threads credentials were refreshed successfully',
        toast: 'outline-success'
      })
    } else {
      const reason = String(route.query.threadsReason || 'Threads OAuth failed')
      let readableReason = reason
      try {
        readableReason = decodeURIComponent(reason)
      } catch {
        readableReason = reason
      }

      showErrorToast('Threads connection failed', readableReason)
    }
  }

  if (connectResult || threadsConnectResult) {
    await navigateTo('/admin/social-queue', { replace: true })
  }
})
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
</style>
