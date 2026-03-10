<template>
  <div class="frame flex flex-col h-full">
    <!-- Table -->
    <div class="flex-1 flex flex-col min-h-0">
      <TableFirstLoadSkeleton v-if="!hasLoadedOnce && loading" :rows="pageSize" :col-classes="['w-6','w-48','min-w-80','w-24','w-24','w-28','w-6']" :layout="['dot','multi','multi','pill','pill','date','dot']" :show-footer="true" />

      <div v-else-if="hasLoadedOnce && messages.length === 0" class="text-center py-16">
        <NIcon name="i-ph-inbox" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium">No messages</h3>
        <p class="text-gray-500">Try adjusting your filters.</p>
      </div>

      <div v-else class="flex-1 flex flex-col rounded-2 border border-gray-200 dark:border-gray-700">
        <div class="group flex-1 overflow-auto">
          <NTable :columns="columns" :data="messages" :loading="loading" manual-pagination>
            <template #select-header>
              <div>
                <NCheckbox
                  checkbox="gray"
                  :model-value="allSelected"
                  @update:model-value="toggleAllSelection"
                />
              </div>
            </template>

            <template #select-cell="{ cell }">
              <div class="items-center justify-center" :class="[
                Object.keys(rowSelection).length > 0 ? 'flex' : 'hidden',
                'group-hover:flex',
              ]">
                <NCheckbox
                  checkbox="gray"
                  :model-value="!!rowSelection[cell.row.original.id]"
                  @click="e => handleRowCheckboxClick(e, cell.row.index, cell.row.original.id)"
                />
              </div>
            </template>

            <template #message-header>
              <div class="flex items-center gap-2">
                <span>Messages</span>
                <div class="flex-1">
                  <NInput 
                    v-model="searchQuery" 
                    placeholder="Search name, email, or message..." 
                    size="sm"
                    leading="i-ph-magnifying-glass" 
                    :loading="loading" 
                    :trailing="searchQuery.length ? 'i-ph-x' : undefined" 
                    :una="{
                      inputTrailing: 'pointer-events-auto cursor-pointer',
                    }"
                    @trailing="resetFilters" />
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

                <div class="flex items-center gap-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <div>
                    <span class="text-size-3 font-500 italic color-gray-500 dark:color-gray-300">From: </span>
                    <span class="text-sm font-medium">{{ cell.row.original.user_name || cell.row.original.name || 'Anonymous' }}</span>
                    <span v-if="cell.row.original.user_email || cell.row.original.email" class="ml-1 text-xs text-gray-500">({{ cell.row.original.user_email || cell.row.original.email || '' }})</span>
                  </div>
                </div>
              </div>
            </template>

            <template #category-header>
              <div>
                <NSelect v-model="categoryFilter" :items="categoryOptions" item-key="label" value-key="label" size="xs" />
              </div>
            </template>

            <template #category-cell="{ cell }">
              <div class="flex flex-wrap gap-1">
                <NBadge :key="cell.row.original.category" size="xs" badge="solid-gray">{{ cell.row.original.category }}</NBadge>
              </div>
            </template>

            <template #target_type-header>
              <div>
                <NSelect v-model="targetFilter" :items="targetOptions" item-key="label" value-key="label" size="xs" />
              </div>
            </template>

            <template #target_type-cell="{ cell }">
              <div class="flex flex-wrap gap-1">
                <NBadge :key="cell.row.original.target_type" size="xs" badge="solid-gray">{{ cell.row.original.target_type }}</NBadge>
              </div>
            </template>

            <template #status-header>
              <div class="flex items-center gap-2">
                <NSelect v-model="statusFilter" :items="statusOptions" item-key="label" value-key="label" size="xs" />
              </div>
            </template>

            <template #status-cell="{ cell }">
              <div class="flex items-center gap-2">
                <NBadge v-if="cell.row.original.status === 'new'" badge="solid-blue" size="xs">{{ cell.row.original.status }}</NBadge>
                <NBadge v-else-if="cell.row.original.status === 'triaged'" badge="solid-indigo" size="xs">{{ cell.row.original.status }}</NBadge>
                <NBadge v-else-if="cell.row.original.status === 'resolved'" badge="solid-green" size="xs">{{ cell.row.original.status }}</NBadge>
                <NBadge v-else-if="cell.row.original.status === 'spam'" badge="solid-error" size="xs">{{ cell.row.original.status }}</NBadge>
                <NDropdownMenu :items="statusItems(cell.row.original)">
                  <NButton size="xs" btn="ghost-gray" icon label="i-ph-caret-down" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
                </NDropdownMenu>
              </div>
            </template>

            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500">{{ formatRelativeTime(cell.row.original.created_at) }}</span>
            </template>

            <template #actions-header>
              <div class="flex items-center justify-center space-x-1">
                <span v-if="selectedIds.length > 0">{{ selectedIds.length }}</span>
                <NTooltip :_tooltip-content="{
                  class: 'py-2 light:bg-gray-100 dark:bg-gray-950 light:b-gray-2 dark:b-gray-9 shadow-lg dark:shadow-gray-800/50',
                }">
                  <template #default>
                    <NIcon name="i-ph-info" class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                  </template>
                  <template #content>
                    <div class="space-y-2">
                      <div class="flex">
                        <NBadge badge="solid-gray" size="xs" icon="i-ph-selection-background" class="w-full">
                          {{ totalMessages }} Total
                        </NBadge>
                      </div>

                      <div class="flex">
                        <NBadge badge="solid-blue" size="xs" icon="i-ph-exclamation-mark" class="w-full">
                          {{ newCount }} News
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-orange" size="xs" icon="i-ph-user" class="w-full">
                          {{ authenticatedCount }} Authenticated
                        </NBadge>
                      </div>
                    </div>
                  </template>
                </NTooltip>

                <NDropdownMenu :items="headerActions">
                  <NButton size="xs" btn="ghost-gray" icon label="i-ph-caret-down" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
                </NDropdownMenu>
              </div>
            </template>

            <template #actions-cell="{ cell }">
              <NDropdownMenu :items="rowActions(cell.row.original)">
                <NButton icon btn="ghost-gray" size="xs" label="i-ph-dots-three-vertical" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
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
</template>

<script lang="ts" setup>
import { formatRelativeTime } from '~/utils/time-formatter'
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

const searchQuery = ref('')
const statusFilter = ref({ label: 'All statuses', value: '' })
const categoryFilter = ref({ label: 'All categories', value: '' })
const targetFilter = ref({ label: 'All targets', value: '' })

const statusOptions = [
  { label: 'All statuses', value: '' },
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
  { header: 'Message', accessorKey: 'message', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Category', accessorKey: 'category', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Target', accessorKey: 'target_type', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Date', accessorKey: 'date', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Actions', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } }
]

const selectedMessages = computed(() => {
  const ids = selectedIds.value
  return ids.length > 0
    ? messages.value.filter(m => ids.includes(m.id))
    : []
})

const headerActions = computed(() => {
  const actions: Array<any> = []
  // only show the triage/resolved/spam shortcuts when there's a selection
  // and at least one of the selected messages would be affected
  if (selectedMessages.value.length > 0) {
    const msgs = selectedMessages.value
    if (msgs.some(m => m.status !== 'triaged')) {
      actions.push({ label: `Mark ${msgs.length} selected triaged`, leading: 'i-ph-play-duotone', onclick: () => bulkSetStatus('triaged') })
    }
    if (msgs.some(m => m.status !== 'resolved')) {
      actions.push({ label: `Mark ${msgs.length} selected resolved`, leading: 'i-ph-check', onclick: () => bulkSetStatus('resolved') })
    }
    if (msgs.some(m => m.status !== 'spam')) {
      actions.push({ label: `Mark ${msgs.length} selected spam`, leading: 'i-ph-warning', onclick: () => bulkSetStatus('spam') })
    }
    if (actions.length) actions.push({})
  }

  actions.push({ label: 'Refresh', leading: 'i-ph-arrows-clockwise', onclick: () => loadMessages(currentPage.value) })
  actions.push({ label: 'Reset filters', leading: 'i-ph-x', onclick: resetFilters })
  return actions
})

const rowSelection: Ref<Record<number, boolean>> = ref({})
const lastSelectedIndex = ref<number | null>(null) // track last clicked row for shift-range selection

const selectedIds = computed(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = messages.value.length
    const count = selectedIds.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      messages.value.forEach(m => { newSelection[m.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null // reset range anchor when toggling all
  }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  // any truthy value (true or 'indeterminate') selects all, false clears
  if (v) {
    const newSelection: Record<number, boolean> = {}
    messages.value.forEach(m => { newSelection[m.id] = true })
    rowSelection.value = newSelection
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

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
    lastSelectedIndex.value = null
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
  statusFilter.value = { label: 'All statuses', value: '' }
  categoryFilter.value = { label: 'All categories', value: '' }
  targetFilter.value = { label: 'All targets', value: '' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

watchDebounced([searchQuery, statusFilter, categoryFilter, targetFilter], () => {
  currentPage.value = 1
  loadMessages(1)
}, { debounce: 300 })

watch(currentPage, () => { loadMessages(currentPage.value) })

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

// handles click events on row checkboxes, supporting shift‑click range selection
const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently

  if (event.shiftKey && lastSelectedIndex.value !== null) {
    // determine range boundaries
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = messages.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }

  lastSelectedIndex.value = index
}

const bulkSetStatus = async (status: MessageStatus) => {
  if (!selectedIds.value.length) return
  try {
    bulkLoading.value = true
    await $fetch('/api/admin/messages/bulk-status', { method: 'POST', body: { ids: selectedIds.value, status } })
    messages.value.forEach(m => { if (selectedIds.value.includes(m.id)) m.status = status })
    rowSelection.value = {}
    lastSelectedIndex.value = null
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
