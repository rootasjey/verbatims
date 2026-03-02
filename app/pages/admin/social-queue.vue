<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div>
            <NToggleGroup
              v-model="selectedPlatform"
              type="single"
              class="space-x-2 flex-wrap"
            >
              <NToggleGroupItem
                v-for="opt in platformOptions"
                :key="opt.value"
                :value="opt.value"
                size="sm"
                :class="toggleItemColorClass(opt.value)"
              >
                <NIcon :name="opt.label" />
              </NToggleGroupItem>
            </NToggleGroup>
          </div>
          <NButton btn="soft-gray" :loading="providerCheckLoading" @click="checkProvider">
            <NIcon name="i-ph-plugs-connected" />
            Check provider
          </NButton>

          <NButton btn="soft-blue" :loading="runNowLoading" @click="runNow">
            <NIcon name="i-ph-play" />
            Run now
          </NButton>

          <NDropdownMenu :items="actionMenuItems">
            <NButton size="sm" btn="soft-gray" icon label="i-ph-dots-three-vertical" />
          </NDropdownMenu>
        </div>

        <!-- provider info panel -->
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1 bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Provider info</h3>
            <div class="flex flex-col sm:flex-row items-center gap-2">
              <span class="font-medium">
                {{ SOCIAL_PLATFORM_LABELS[selectedPlatform] || selectedPlatform }}
              </span>
              <NBadge :color="statusColorFor(selectedPlatform)" badge="soft" size="xs">
                {{ statusLabelFor(selectedPlatform) }}
              </NBadge>
              <span
                v-if="getPlatformStatus(selectedPlatform).account"
                class="text-xs text-gray-500"
              >
                ID: {{ getPlatformStatus(selectedPlatform).account }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0C0A09]">
      <div class="social-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="queueItems"
          :loading="loading"
          manual-pagination
          empty-text="Queue is empty"
          empty-icon="i-ph-calendar"
        >
          <template #position-cell="{ cell }">
            <span class="text-sm text-gray-900 dark:text-white">#{{ cell.row.original.position }}</span>
          </template>

          <template #quote-header>
            <div class="flex items-center gap-4">
              <span>Quote</span>
              <NInput
                v-model="searchQuery"
                placeholder="Search queue by quote, author, reference..."
                leading="i-ph-magnifying-glass"
                :loading="loading"
                :trailing="searchQuery ? 'i-ph-x' : undefined"
                :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                class="md:w-94"
                size="md"
                input="outline-green"
                @trailing="searchQuery = ''"
              />
            </div>
          </template>

          <template #quote-cell="{ cell }">
            <div class="max-w-md">
              <p class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-normal break-words">
                {{ cell.row.original.quote_text }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ cell.row.original.author_name || 'Unknown author' }}
                <span v-if="cell.row.original.reference_name"> · {{ cell.row.original.reference_name }}</span>
              </p>
            </div>
          </template>

          <template #status-header>
            <div class="flex items-center">
              <NTooltip :_tooltip-content="{
                class: 'py-2 light:bg-gray-100 dark:bg-gray-950 light:b-gray-2 dark:b-gray-9 shadow-lg dark:shadow-gray-800/50',
              }">
                <template #default>
                  <NIcon name="i-ph-info" class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                </template>
                <template #content>
                  <div class="space-y-2">
                    <div class="flex">
                      <NBadge badge="soft" size="xs" icon="i-ph-shuffle" class="w-full">
                        {{ stats.queued }} Queued
                      </NBadge>
                    </div>
                    <div class="flex">
                      <NBadge badge="soft-yellow" size="xs" icon="i-ph-play" class="w-full">
                        {{ stats.processing }} Processing
                      </NBadge>
                    </div>

                    <div class="flex">
                      <NBadge badge="soft-green" size="xs" icon="i-ph-check" class="w-full">
                        {{ stats.posted }} Posted
                      </NBadge>
                    </div>
                    <div class="flex">
                      <NBadge badge="soft-red" size="xs" icon="i-ph-x" class="w-full">
                        {{ stats.failed }} Failed
                      </NBadge>
                    </div>
                  </div>
                </template>
              </NTooltip>

              <NSelect
                v-model="selectedStatus"
                :items="statusOptions"
                item-key="label"
                value-key="label"
                size="xs"
                placeholder="All statuses"
              />
            </div>
          </template>

          <template #status-cell="{ cell }">
            <NBadge :color="statusColor(cell.row.original.status)" badge="soft" size="xs">
              {{ cell.row.original.status }}
            </NBadge>
          </template>

          <template #postedCount-cell="{ cell }">
            <span class="text-sm text-gray-900 dark:text-white">{{ cell.row.original.quote_posts_count || 0 }}</span>
          </template>

          <template #lastPosted-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatLastPosted(cell.row.original.last_posted_at) }}
            </span>
          </template>

          <template #actions-header>
            <div class="flex items-center justify-center space-x-1">
              <span>Actions</span>
              <NDropdownMenu :items="tableHeaderMenuItems">
                <NButton size="10px" btn="soft-gray" icon label="i-ph-dots-three-vertical" />
              </NDropdownMenu>
            </div>
          </template>

          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="rowActionItems(cell.row.original)">
              <NButton size="xs" btn="soft-gray" icon label="i-ph-dots-three-vertical" />
            </NDropdownMenu>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalItems }} items
        </div>
        <NPagination
          v-model:page="currentPage"
          :total="totalItems"
          :items-per-page="pageSize"
          :sibling-count="2"
          show-edges
          size="sm"
        />
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
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS } from '~~/shared/constants/social'
import { watch, computed, onMounted } from 'vue'
import { useAdminSocialQueue } from '~/composables/useAdminSocialQueue'
import type { SocialQueueItem } from '~/composables/useAdminSocialQueue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Social Queue - Admin - Verbatims'
})

const providerCheckLoading = ref(false)
const metaStatusLoading = ref(false)
const metaConnectLoading = ref(false)
const metaConfigLoading = ref(false)
const metaConfigSaving = ref(false)
const metaConfigDialogOpen = ref(false)
const providerConfigLoading = ref(false)
const providerConfigSaving = ref(false)
const providerConfigDialogOpen = ref(false)

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
  clearFinishedQueue: clearFinishedQueueRequest
} = useAdminSocialQueue({
  showErrorToast
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
  if (isMetaPlatform(platform)) {
    if (platform === 'facebook') {
      const m = metaStatus.value.facebook as MetaFacebookStatus
      return {
        ok: m.connected,
        platform,
        account: m.pageName || m.pageId || '',
        expiresAt: null,
        loading: providerStatus[platform].loading,
        lastChecked: providerStatus[platform].lastChecked
      } as PlatformStatus
    }

    const m = metaStatus.value[platform as Exclude<MetaPlatformKey, 'facebook'>] as MetaUserStatus

    return {
      ok: m.connected,
      platform,
      account: m.username || m.userId || '',
      expiresAt: m.expiresAt ?? null,
      loading: providerStatus[platform].loading,
      lastChecked: providerStatus[platform].lastChecked
    } as PlatformStatus
  }
  return providerStatus[platform]
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

const tableColumns = [
  {
    header: 'Position',
    accessorKey: 'position',
    enableSorting: false,
    meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } }
  },
  {
    header: 'Quote',
    accessorKey: 'quote',
    enableSorting: false,
    meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } }
  },
  {
    header: 'Status',
    accessorKey: 'status',
    enableSorting: false,
    meta: { una: { tableHead: 'w-28', tableCell: 'w-28 text-center' } }
  },
  {
    header: 'Posted Count',
    accessorKey: 'postedCount',
    enableSorting: false,
    meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } }
  },
  {
    header: 'Last Posted',
    accessorKey: 'lastPosted',
    enableSorting: false,
    meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } }
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    enableSorting: false,
    meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } }
  }
]

function statusColor(status: SocialQueueStatus) {
  if (status === 'queued') return 'blue'
  if (status === 'processing') return 'yellow'
  if (status === 'posted') return 'green'
  return 'red'
}

function formatLastPosted(value: string | null) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return date.toLocaleDateString()
}

function showErrorToast(title: string, description: string) {
  useToast().toast({
    title,
    description,
    actions: [
      {
        label: 'Copy',
        btn: 'soft-gray',
        altText: 'Copy error message',
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(description)
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
      }
    ],
    toast: 'outline-error'
  })
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
  if (isMetaPlatform(selectedPlatform.value)) {
    items.push({ label: 'Provider settings', leading: 'i-ph-gear', onclick: openProviderConfigDialog })
    items.push({ label: 'Meta OAuth settings', leading: 'i-ph-sliders-horizontal', onclick: openMetaConfigDialog })
    items.push({ label: 'Reconnect', leading: 'i-ph-arrow-clockwise', onclick: connectMeta })
  } else if (isEditableProvider(selectedPlatform.value)) {
    items.push({ label: 'Settings', leading: 'i-ph-gear', onclick: openProviderConfigDialog })
  }
  items.push({ label: 'Run now', leading: 'i-ph-play', onclick: runNow })
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

async function clearAllQueue() {
  await clearAllQueueRequest()
  showClearAllDialog.value = false
}

async function clearFinishedQueue() {
  await clearFinishedQueueRequest()
  showClearFinishedDialog.value = false
}

onMounted(async () => {
  await loadQueue()
  await loadMetaStatus()
  await refreshAllStatuses()

  const connectResult = String(route.query.metaConnect || '')
  if (!connectResult) return

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

  await navigateTo('/admin/social-queue', { replace: true })
})
</script>

<style scoped>
.social-table-container {
  max-height: calc(100vh - 24rem);
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
