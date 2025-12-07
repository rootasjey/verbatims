<template>
  <div class="frame flex flex-col h-full">
    <!-- Fixed Header with Filters/Stats -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <NInput v-model="searchQuery" placeholder="Search name, email, or message..." leading="i-ph-magnifying-glass" :loading="loading" />
        </div>
        <div class="flex gap-2">
          <NSelect v-model="statusFilter" :items="statusOptions" item-key="label" value-key="label" class="w-40" />
          <NSelect v-model="categoryFilter" :items="categoryOptions" item-key="label" value-key="label" class="w-40" />
          <NSelect v-model="targetFilter" :items="targetOptions" item-key="label" value-key="label" class="w-40" />
          <NButton btn="outline-gray" @click="resetFilters"><NIcon name="i-ph-x" />Reset</NButton>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-envelope" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm text-gray-500">Total</p>
              <p class="text-2xl font-semibold">{{ totalMessages }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-clock" class="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p class="text-sm text-gray-500">New</p>
              <p class="text-2xl font-semibold">{{ newCount }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-users" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm text-gray-500">Authenticated</p>
              <p class="text-2xl font-semibold">{{ authenticatedCount }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions (animated) -->
    <NCollapsible v-model:open="bulkOpen">
      <NCollapsibleContent>
        <div class="flex-shrink-0 mb-6">
          <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm">{{ selectedIds.length }} selected</span>
              <div class="flex gap-2">
                <NButton size="sm" btn="ghost-blue" :loading="bulkLoading" @click="bulkSetStatus('triaged')"><NIcon name="i-ph-play-duotone"/>Triage</NButton>
                <NButton size="sm" btn="ghost-green" :loading="bulkLoading" @click="bulkSetStatus('resolved')"><NIcon name="i-ph-check" />Resolve</NButton>
                <NButton size="sm" btn="ghost-pink" :loading="bulkLoading" @click="bulkSetStatus('spam')"><NIcon name="i-ph-warning" />Spam</NButton>
                <NButton size="sm" btn="ghost-gray" @click="clearSelection">Clear</NButton>
              </div>
            </div>
          </div>
        </div>
      </NCollapsibleContent>
    </NCollapsible>

    <!-- Table -->
    <div class="flex-1 flex flex-col min-h-0">
      <TableFirstLoadSkeleton v-if="!hasLoadedOnce && loading" :rows="pageSize" :col-classes="['w-6','w-48','min-w-80','w-24','w-24','w-28','w-6']" :layout="['dot','multi','multi','pill','pill','date','dot']" :show-footer="true" />

      <div v-else-if="hasLoadedOnce && messages.length === 0" class="text-center py-16">
        <NIcon name="i-ph-inbox" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium">No messages</h3>
        <p class="text-gray-500">Try adjusting your filters.</p>
      </div>

      <div v-else class="flex-1 flex flex-col rounded-2 border border-gray-200 dark:border-gray-700">
        <div class="flex-1 overflow-auto">
          <NTable :columns="columns" :data="messages" :loading="loading" manual-pagination>
            <template #select-cell="{ cell }">
              <div class="flex items-center justify-center">
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, v)" />
              </div>
            </template>

            <template #from-cell="{ cell }">
              <div class="flex items-center gap-2">
                <NAvatar size="xs" :src="cell.row.original.user_id ? undefined : undefined" />
                <div>
                  <div class="text-sm font-medium">{{ cell.row.original.user_name || cell.row.original.name || 'Anonymous' }}</div>
                  <div class="text-xs text-gray-500">{{ cell.row.original.user_email || cell.row.original.email || '' }}</div>
                </div>
              </div>
            </template>

            <template #message-cell="{ cell }">
              <div class="max-w-xl">
                <div class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{{ truncate(cell.row.original.message, 280) }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  <span class="capitalize">{{ cell.row.original.category }}</span>
                  <span v-if="cell.row.original.target_type !== 'general'"> • {{ formatTarget(cell.row.original) }}</span>
                </div>
              </div>
            </template>

            <template #tags-cell="{ cell }">
              <div class="flex flex-wrap gap-1">
                <NBadge v-for="t in (cell.row.original.tags || []).slice(0,3)" :key="t" size="xs" variant="soft">{{ t }}</NBadge>
                <NBadge v-if="(cell.row.original.tags||[]).length>3" size="xs" variant="soft">+{{ (cell.row.original.tags||[]).length-3 }}</NBadge>
              </div>
            </template>

            <template #status-cell="{ cell }">
              <div class="flex items-center gap-2">
                <NBadge :color="statusColor(cell.row.original.status)" variant="subtle" size="xs">{{ cell.row.original.status }}</NBadge>
                <NDropdownMenu :items="statusItems(cell.row.original)">
                  <NButton size="2xs" btn="ghost" icon label="i-ph-caret-down" />
                </NDropdownMenu>
              </div>
            </template>

            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500">{{ formatRelativeTime(cell.row.original.created_at) }}</span>
            </template>

            <template #actions-cell="{ cell }">
              <NDropdownMenu :items="rowActions(cell.row.original)">
                <NButton icon btn="ghost" size="xs" label="i-ph-dots-three-vertical" />
              </NDropdownMenu>
            </template>
          </NTable>
        </div>

        <div class="flex-shrink-0 flex items-center justify-between p-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500">Page {{ currentPage }} of {{ totalPages }} • {{ totalMessages }} total</div>
          <NPagination v-model:page="currentPage" :total="totalMessages" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" />
        </div>
      </div>
    </div>
  </div>
</template><template #select-cell="{ cell }">
              <div class="flex items-center justify-center">
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, v)" />
              </div>
            </template>

            <template #from-cell="{ cell }">
              <div class="flex items-center gap-2">
                <NAvatar size="xs" :src="cell.row.original.user_id ? undefined : undefined" />
                <div>
                  <div class="text-sm font-medium">{{ cell.row.original.user_name || cell.row.original.name || 'Anonymous' }}</div>
                  <div class="text-xs text-gray-500">{{ cell.row.original.user_email || cell.row.original.email || '' }}</div>
                </div>
              </div>
            </template>

            <template #message-cell="{ cell }">
              <div class="max-w-xl">
                <div class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{{ truncate(cell.row.original.message, 280) }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  <span class="capitalize">{{ cell.row.original.category }}</span>
                  <span v-if="cell.row.original.target_type !== 'general'"> • {{ formatTarget(cell.row.original) }}</span>
                </div>
              </div>
            </template>

            <template #tags-cell="{ cell }">
              <div class="flex flex-wrap gap-1">
                <NBadge v-for="t in (cell.row.original.tags || []).slice(0,3)" :key="t" size="xs" variant="soft">{{ t }}</NBadge>
                <NBadge v-if="(cell.row.original.tags||[]).length>3" size="xs" variant="soft">+{{ (cell.row.original.tags||[]).length-3 }}</NBadge>
              </div>
            </template>

            <template #status-cell="{ cell }">
              <div class="flex items-center gap-2">
                <NBadge :color="statusColor(cell.row.original.status)" variant="subtle" size="xs">{{ cell.row.original.status }}</NBadge>
                <NDropdownMenu :items="statusItems(cell.row.original)">
                  <NButton size="2xs" btn="ghost" icon label="i-ph-caret-down" />
                </NDropdownMenu>
              </div>
            </template>

            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500">{{ formatRelativeTime(cell.row.original.created_at) }}</span>
            </template>

            <template #actions-cell="{ cell }">
              <NDropdownMenu :items="rowActions(cell.row.original)">
                <NButton icon btn="ghost" size="xs" label="i-ph-dots-three-vertical" />
              </NDropdownMenu>
            </template>
          </UTable>
        </div>

        <div class="flex-shrink-0 flex items-center justify-between p-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500">Page {{ currentPage }} of {{ totalPages }} • {{ totalMessages }} total</div>
          <UPagination v-model:page="currentPage" :total="totalMessages" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatRelativeTime } from '~/utils/time-formatter'
import type { AdminUserMessage } from '~/types'
type MessageStatus = AdminUserMessage['status']

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Messages - Admin - Verbatims' })

const messages: Ref<AdminUserMessage[]> = ref([])
const loading = ref(true)
const hasLoadedOnce = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const totalMessages = ref(0)
const totalPages = ref(0)
const bulkLoading = ref(false)
const bulkOpen = ref(false)

const searchQuery = ref('')
const statusFilter = ref({ label: 'New', value: 'new' })
const categoryFilter = ref({ label: 'All categories', value: '' })
const targetFilter = ref({ label: 'All targets', value: '' })

const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Triaged', value: 'triaged' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Spam', value: 'spam' }
]

const categoryOptions = [
  { label: 'All categories', value: '' },
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Content', value: 'content' },
  { label: 'Other', value: 'other' }
]

const targetOptions = [
  { label: 'All targets', value: '' },
  { label: 'General', value: 'general' },
  { label: 'Quote', value: 'quote' },
  { label: 'Author', value: 'author' },
  { label: 'Reference', value: 'reference' }
]

const columns = [
  { header: '', accessorKey: 'select', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: 'From', accessorKey: 'from', enableSorting: false, meta: { una: { tableHead: 'w-48', tableCell: 'w-48' } } },
  { header: 'Message', accessorKey: 'message', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Tags', accessorKey: 'tags', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Date', accessorKey: 'date', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } }
]

const rowSelection: Ref<Record<number, boolean>> = ref({})
const selectedIds = computed(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
const setRowSelected = (id: number, v: unknown) => { rowSelection.value[id] = v === true }
const clearSelection = () => { rowSelection.value = {} }

// Keep the collapsible in sync with current selection for smooth animation
watch(selectedIds, (ids) => {
  bulkOpen.value = ids.length > 0
}, { immediate: true })

const loadMessages = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      limit: pageSize.value,
      status: statusFilter.value?.value,
      category: categoryFilter.value?.value || undefined,
      target_type: targetFilter.value?.value || undefined,
      search: searchQuery.value || undefined
    }
    const res = await $fetch('/api/admin/messages', { query: params })
    messages.value = res.data || []
    totalMessages.value = res.pagination?.total || 0
    totalPages.value = res.pagination?.totalPages || 0
    pageSize.value = res.pagination?.limit || pageSize.value
    rowSelection.value = {}
    currentPage.value = page
  } catch (err) {
    console.error('Failed to load messages', err)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = { label: 'New', value: 'new' }
  categoryFilter.value = { label: 'All categories', value: '' }
  targetFilter.value = { label: 'All targets', value: '' }
  currentPage.value = 1
}

watchDebounced([searchQuery, statusFilter, categoryFilter, targetFilter], () => {
  currentPage.value = 1
  loadMessages(1)
}, { debounce: 300 })

watch(currentPage, () => { loadMessages(currentPage.value) })

const statusColor = (s: MessageStatus) => {
  const map: Record<MessageStatus, string> = { new: 'yellow', triaged: 'blue', resolved: 'green', spam: 'red' }
  return map[s] ?? 'gray'
}

const truncate = (t: string, n: number): string => t?.length > n ? t.slice(0, n) + '…' : t
const formatTarget = (row: AdminUserMessage) => row.target_type === 'quote' ? `Quote: ${truncate(row.target_label, 40)}` : row.target_type === 'author' ? `Author: ${row.target_label}` : row.target_type === 'reference' ? `Reference: ${row.target_label}` : 'General'

const setStatus = async (row: AdminUserMessage, status: MessageStatus) => {
  try {
    await $fetch(`/api/admin/messages/${row.id}/status`, { method: 'POST', body: { status } })
    row.status = status
  } catch (err) {
    console.error('Failed to set status', err)
  }
}

const statusItems = (row: AdminUserMessage) => ([
  { label: 'New', leading: 'i-ph-star-four-duotone', onclick: () => setStatus(row, 'new') },
  { label: 'Triaged', leading: 'i-ph-play-duotone', onclick: () => setStatus(row, 'triaged') },
  { label: 'Resolved', leading: 'i-ph-check', onclick: () => setStatus(row, 'resolved') },
  { label: 'Spam', leading: 'i-ph-warning', onclick: () => setStatus(row, 'spam') }
])

const rowActions = (row: AdminUserMessage) => ([
  {
    label: 'Copy details', leading: 'i-ph-copy', onclick: async () => {
  const summary = `From: ${row.user_name || row.name || 'Anonymous'} <${row.user_email || row.email || ''}>\nCategory: ${row.category}\nTarget: ${row.target_type}${row.target_label ? ` (${row.target_label})` : ''}\nTags: ${(row.tags || []).join(', ')}\nMessage: ${row.message}`
      try { await navigator.clipboard.writeText(summary) } catch {}
    }
  },
  {},
  { label: 'Mark triaged', leading: 'i-ph-play-duotone', onclick: () => setStatus(row, 'triaged') },
  { label: 'Mark resolved', leading: 'i-ph-check', onclick: () => setStatus(row, 'resolved') },
  { label: 'Mark spam', leading: 'i-ph-warning', onclick: () => setStatus(row, 'spam') }
])

const bulkSetStatus = async (status: MessageStatus) => {
  if (!selectedIds.value.length) return
  try {
    bulkLoading.value = true
    await $fetch('/api/admin/messages/bulk-status', { method: 'POST', body: { ids: selectedIds.value, status } })
    messages.value.forEach(m => { if (selectedIds.value.includes(m.id)) m.status = status })
    rowSelection.value = {}
  } catch (err) {
    console.error('Failed bulk set status', err)
  } finally {
    bulkLoading.value = false
  }
}

const newCount = computed(() => messages.value.filter(m => m.status === 'new').length)
const authenticatedCount = computed(() => messages.value.filter(m => !!m.user_id).length)

onMounted(() => { loadMessages() })
</script>

<style scoped>
.frame { height: calc(100vh - 8rem); }
</style>
