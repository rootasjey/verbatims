<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-1 flex flex-col">
      <div class="group sponsors-table-container flex-1 overflow-auto border rounded-2">
        <NTable
          :columns="tableColumns"
          :data="messages"
          :loading="loading"
          :una="{
            tableRoot: '!overflow-visible border-none',
            scrollAreaRoot: '!overflow-visible',
            table: '!w-auto min-w-full',
            tableHeader: 'sticky top-0 z-1 bg-[#FAFAF9] dark:bg-[#0C0A09]',
            tableBody: 'bg-white dark:bg-[#0C0A09]'
          }"
          manual-pagination
          empty-text="No sponsor messages found"
          empty-icon="i-ph-megaphone"
        >
          <template #message-header>
            <div class="flex items-center gap-2">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Message</h4>
              <div class="w-80">
                <NInput
                  v-model="searchQuery"
                  placeholder="Search messages..."
                  leading="i-ph-magnifying-glass"
                  size="md"
                  :loading="loading"
                  :trailing="searchQuery ? 'i-ph-x' : undefined"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="resetFilters"
                />
              </div>
              <div>
                <NSelect
                  v-model="selectedSort"
                  :items="sortOptions"
                  placeholder="Sort by"
                  size="sm"
                  item-key="label"
                  value-key="label"
                />
              </div>
            </div>
          </template>

          <template #status-cell="{ cell }">
            <NBadge :badge="getStatusBadge(cell.row.original)" size="xs">
              {{ getStatusText(cell.row.original) }}
            </NBadge>
          </template>

          <template #type-cell="{ cell }">
            <span class="text-xs font-mono">{{ cell.row.original.type }}</span>
          </template>

          <template #priority-cell="{ cell }">
            <span class="text-sm">{{ cell.row.original.priority }}</span>
          </template>

          <template #dates-cell="{ cell }">
            <div class="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
              <div v-if="cell.row.original.startsAt">Start: {{ formatDate(cell.row.original.startsAt) }}</div>
              <div v-if="cell.row.original.endsAt">End: {{ formatDate(cell.row.original.endsAt) }}</div>
              <div v-else class="text-gray-400">No dates set</div>
            </div>
          </template>

          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(cell.row.original.createdAt) }}</span>
          </template>

          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="getRowActions(cell.row.original)">
              <NButton icon btn="ghost-gray" size="xs" label="i-ph-dots-three-vertical" class="hover:bg-gray-200 dark:hover:bg-gray-700/50" />
            </NDropdownMenu>
          </template>

          <template #actions-header>
            <div class="flex items-center justify-center space-x-1">
              <span v-if="selectedIds.length > 0">{{ selectedIds.length }}</span>
              <NDropdownMenu :items="headerActions">
                <NButton size="xs" btn="ghost-gray" icon label="i-ph-caret-down" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
              </NDropdownMenu>
            </div>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ total }} total messages
        </div>
        <NPagination v-model:page="currentPage" :total="total" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" pagination-selected="solid-indigo" />
      </div>
    </div>
  </div>

  <AddSponsorMessageDialog v-model="showDialog" :edit-message="editingMessage" @saved="reload" />
  <DeleteSponsorMessageDialog v-model="showDeleteDialog" :message="deletingMessage" @deleted="handleDeleted" />

  <!-- Bulk Delete Dialog -->
  <NDialog v-model:open="showBulkDeleteDialog">
    <template #header>
      <h3 class="text-lg font-semibold">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'message' : 'messages' }}</h3>
    </template>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      You are about to delete {{ selectedIds.length }} sponsor {{ selectedIds.length === 1 ? 'message' : 'messages' }}.
    </p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton btn="ghost" @click="showBulkDeleteDialog = false">Cancel</NButton>
        <NButton btn="soft-red" :loading="bulkProcessing" @click="confirmBulkDelete">Delete All</NButton>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Sponsors - Admin - Verbatims' })

const loading = ref(false)
const messages = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedSort = ref({ label: 'Priority (High)', value: 'priority_desc' })

const showDialog = ref(false)
const editingMessage = ref<any | null>(null)
const showDeleteDialog = ref(false)
const deletingMessage = ref<{ id: number; message: string } | null>(null)

const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)

const selectedIds = computed(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const sortOptions = [
  { label: 'Priority (High)', value: 'priority_desc' },
  { label: 'Priority (Low)', value: 'priority_asc' },
  { label: 'Most Recent', value: 'created_at_desc' },
  { label: 'Oldest First', value: 'created_at_asc' },
]

const tableColumns = [
  { header: 'Message', accessorKey: 'message', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Type', accessorKey: 'type', enableSorting: false, meta: { una: { tableHead: 'w-20', tableCell: 'w-20' } } },
  { header: 'Priority', accessorKey: 'priority', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
  { header: 'Schedule', accessorKey: 'dates', enableSorting: false, meta: { una: { tableHead: 'w-44', tableCell: 'w-44' } } },
  { header: 'Created', accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-12', tableCell: 'w-12' } } },
]

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const toMs = (val: any) => val ? new Date(val).getTime() : 0

const formatDate = (ts: number | string | null | undefined) => {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getStatusText = (msg: any) => {
  if (!msg.isActive) return 'Inactive'
  const now = Date.now()
  if (msg.startsAt && toMs(msg.startsAt) > now) return 'Scheduled'
  if (msg.endsAt && toMs(msg.endsAt) < now) return 'Expired'
  return 'Active'
}

const getStatusBadge = (msg: any) => {
  const status = getStatusText(msg)
  switch (status) {
    case 'Active': return 'soft-green'
    case 'Scheduled': return 'outline-blue'
    case 'Expired': return 'soft-gray'
    case 'Inactive': return 'outline-gray'
    default: return 'soft-gray'
  }
}

const headerActions = computed(() => {
  const actions: any[] = []
  if (selectedIds.value.length > 0) {
    actions.push({
      label: 'Delete Selected',
      leading: 'i-ph-trash',
      onclick: () => { showBulkDeleteDialog.value = true }
    })
  }
  if (actions.length > 0) actions.push({})
  actions.push({
    label: 'Add New Message',
    leading: 'i-ph-plus',
    onclick: () => { editingMessage.value = null; showDialog.value = true }
  })
  actions.push({})
  actions.push({
    label: 'Refresh',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadMessages()
  })
  actions.push({
    label: 'Reset Filters',
    leading: 'i-ph-x',
    onclick: () => resetFilters()
  })
  return actions
})

const getRowActions = (msg: any) => [
  {
    label: 'Edit Message',
    leading: 'i-ph-pencil',
    onclick: () => { editingMessage.value = msg; showDialog.value = true }
  },
  {},
  {
    label: 'Delete Message',
    leading: 'i-ph-trash',
    onclick: () => { deletingMessage.value = { id: msg.id, message: msg.message }; showDeleteDialog.value = true }
  }
]

const loadMessages = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1).toUpperCase()

    const res: any = await $fetch('/api/admin/sponsors', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      }
    })
    messages.value = res.data || []
    total.value = res.pagination?.total || 0
    rowSelection.value = {}
    lastSelectedIndex.value = null
  } catch (e) {
    console.error('Failed to load sponsor messages', e)
    useToast().toast({ toast: 'soft-error', title: 'Error', description: 'Failed to load sponsor messages' })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedSort.value = sortOptions[0]
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

const reload = () => {
  showDialog.value = false
  editingMessage.value = null
  loadMessages()
}

const handleDeleted = () => {
  showDeleteDialog.value = false
  deletingMessage.value = null
  if (messages.value.length <= 1 && currentPage.value > 1) {
    currentPage.value -= 1
  }
  loadMessages()
}

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/sponsors/${id}`, { method: 'DELETE' })))
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = results.length - failed
    if (failed) {
      useToast().toast({ toast: 'outline-warning', title: `Deleted ${succeeded} message${succeeded !== 1 ? 's' : ''}`, description: `${failed} failed` })
    }
  } catch (e) {
    useToast().toast({ toast: 'soft-error', title: 'Bulk delete failed' })
  } finally {
    bulkProcessing.value = false
    showBulkDeleteDialog.value = false
    rowSelection.value = {}
    lastSelectedIndex.value = null
    loadMessages()
  }
}

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadMessages() }, { debounce: 300 })
onMounted(() => { loadMessages() })
</script>

<style scoped>
.sponsors-table-container {
  max-height: calc(100vh - 11rem);
  max-width: calc(100vw - 8rem);
}

:deep(.table-header tr) {
  border-bottom: none;
}

:deep([data-reka-scroll-area-viewport]) {
  overflow: visible !important;
}

:deep([data-reka-scroll-area-corner]) {
  display: none !important;
}

.frame { min-height: calc(100vh - 8rem) }
</style>
