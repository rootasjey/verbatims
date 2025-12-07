<template>
  <div class="frame flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <NInput
            v-model="searchQuery"
            placeholder="Search quotes, authors, or users..."
            leading="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
          />
        </div>
        <div class="flex gap-2">
          <NSelect
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="Filter by status"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <NButton
            btn="outline-gray"
            size="sm"
            @click="resetFilters"
          >
            <NIcon name="i-ph-x" />
            Reset
          </NButton>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-clock" class="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pendingCount }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selected</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ selectedQuotes.length }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-users" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Contributors</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ uniqueContributors }}</p>
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
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }} selected
              </span>
              <div class="flex items-center gap-3">
                <NButton size="sm" btn="ghost-blue" :loading="bulkProcessing" @click="bulkApprove">
                  <NIcon name="i-ph-check" />
                  Approve Selected
                </NButton>
                <NButton size="sm" btn="ghost-pink" :loading="bulkProcessing" @click="showBulkRejectModal = true">
                  <NIcon name="i-ph-x" />
                  Reject Selected
                </NButton>
                <NButton size="sm" btn="ghost-gray" @click="clearSelection">
                  Clear Selection
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </NCollapsibleContent>
    </NCollapsible>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- First-load Skeleton State -->
      <TableFirstLoadSkeleton
        v-if="!hasLoadedOnce && loading"
        :rows="pageSize"
        :col-classes="[
          'min-w-80 flex-1',
          'w-48',
          'w-32',
          'w-32',
          'w-28',
          'w-6'
        ]"
        :layout="['multi','multi','pill','pill','date','dot']"
        :show-footer="true"
      />

      <!-- Empty State -->
      <div v-else-if="hasLoadedOnce && quotes.length === 0" class="text-center py-16">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching quotes found' : 'All caught up!' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'No pending quotes to review at the moment.' }}
        </p>
      </div>

      <!-- Quotes Table -->
      <div v-else class="flex-1 flex flex-col rounded-2 border border-gray-200 dark:border-gray-700">
        <!-- Scrollable Table Container -->
        <div class="quotes-table-container flex-1 overflow-auto">
          <NTable
            :columns="tableColumns"
            :data="quotes"
            :loading="loading"
            manual-pagination
            empty-text="No pending quotes found"
            empty-icon="i-ph-clock"
          >
            <!-- Actions Header: Selection mode & select-all on page -->
            <template #actions-header>
              <div class="flex items-center justify-center gap-1">
                <template v-if="selectionMode">
                  <NTooltip text="Select all on page">
                    <NButton
                      icon
                      btn="ghost"
                      size="2xs"
                      label="i-ph-checks"
                      :disabled="allSelectedOnPage"
                      @click="selectAllOnPage"
                    />
                  </NTooltip>
                </template>
                <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                  <NButton
                    icon
                    btn="ghost-gray"
                    size="2xs"
                    :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                    @click="toggleSelectionMode"
                  />
                </NTooltip>
              </div>
            </template>

            <!-- Quote Column with text wrapping -->
            <template #quote-cell="{ cell }">
              <div class="max-w-md">
                <blockquote
                  class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-normal break-words mb-2"
                  :title="cell.row.original.name"
                >
                  {{ cell.row.original.name }}
                </blockquote>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="cell.row.original.author_name">{{ cell.row.original.author_name }}</span>
                  <span v-if="cell.row.original.author_name && cell.row.original.reference_name">•</span>
                  <span v-if="cell.row.original.reference_name">{{ cell.row.original.reference_name }}</span>
                </div>
              </div>
            </template>

            <!-- User Column -->
            <template #user-cell="{ cell }">
              <div class="flex items-center space-x-2">
                <NAvatar
                  :src="cell.row.original.user_avatar"
                  :alt="cell.row.original.user_name"
                  size="xs"
                  :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ cell.row.original.user_name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ cell.row.original.user_email }}
                  </p>
                </div>
              </div>
            </template>

            <!-- Tags Column -->
            <template #tags-cell="{ cell }">
              <div v-if="cell.row.original.tags && cell.row.original.tags.length > 0" class="flex flex-wrap gap-1">
                <NBadge
                  v-for="tag in cell.row.original.tags.slice(0, 2)"
                  :key="tag.name"
                  :style="{ backgroundColor: tag.color }"
                  variant="soft"
                  size="xs"
                >
                  {{ tag.name }}
                </NBadge>
                <NBadge
                  v-if="cell.row.original.tags.length > 2"
                  variant="soft"
                  size="xs"
                  color="gray"
                >
                  +{{ cell.row.original.tags.length - 2 }}
                </NBadge>
              </div>
              <span v-else class="text-xs text-gray-400 dark:text-gray-600 italic">
                No tags
              </span>
            </template>

            <!-- Status Column -->
            <template #status-cell="{ cell }">
              <div class="space-y-1">
                <NBadge :color="getStatusColor(cell.row.original.status)" variant="subtle" size="xs">
                  {{ cell.row.original.status }}
                </NBadge>
                <div v-if="cell.row.original.status === 'rejected' && cell.row.original.rejection_reason" class="text-xs text-red-600 dark:text-red-400">
                  {{ cell.row.original.rejection_reason.substring(0, 30) }}{{ cell.row.original.rejection_reason.length > 30 ? '...' : '' }}
                </div>
              </div>
            </template>

            <!-- Date Column -->
            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(cell.row.original.created_at) }}
              </span>
            </template>

            <!-- Actions Column -->
            <template #actions-cell="{ cell }">
              <template v-if="!selectionMode">
                <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                  <NButton
                    icon
                    btn="ghost"
                    size="xs"
                    label="i-ph-dots-three-vertical"
                  />
                </NDropdownMenu>
              </template>
              <template v-else>
                <div class="flex items-center justify-center">
                  <NCheckbox
                    :model-value="!!rowSelection[cell.row.original.id]"
                    @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                  />
                </div>
              </template>
            </template>
          </NTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 flex items-center justify-between p-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Page {{ currentPage }} of {{ totalPages }} • {{ totalQuotes }} total quotes
          </div>
          <NPagination
            v-model:page="currentPage"
            :total="totalQuotes"
            :items-per-page="pageSize"
            :sibling-count="2"
            show-edges
            size="sm"
          />
        </div>
      </div>
    </div>

    <AdminQuoteDetailDialog 
      v-model:open="showQuoteDialog" 
      :quote="selectedQuote"
      @edit="editQuote"
    />
  </div>

    <!-- Reject Quote Modal -->
    <NDialog v-model:open="showRejectModal">
      <NCard class="border-none shadow-none">
        <template #header>
          <h3 class="text-lg font-semibold">Reject Quote</h3>
        </template>

        <div class="space-y-4">
          <div v-if="selectedQuote" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <blockquote class="text-sm font-medium text-gray-900 dark:text-white">
              "{{ selectedQuote.name }}"
            </blockquote>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              by {{ selectedQuote.user_name }}
            </p>
          </div>

          <NFormGroup label="Rejection Reason" required>
            <NInput
              type="textarea"
              v-model="rejectionReason"
              placeholder="Please provide a reason for rejecting this quote..."
              :rows="3"
              :disabled="processing.has(selectedQuote?.id)"
            />
          </NFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton
              btn="ghost"
              @click="showRejectModal = false"
              :disabled="processing.has(selectedQuote?.id)"
            >
              Cancel
            </NButton>
            <NButton
              btn="soft-red"
              :loading="processing.has(selectedQuote?.id)"
              @click="confirmRejectQuote"
            >
              Reject Quote
            </NButton>
          </div>
        </template>
      </NCard>
    </NDialog>

    <!-- Bulk Reject Modal -->
    <NDialog v-model:open="showBulkRejectModal">
      <NCard>
        <template #header>
          <h3 class="text-lg font-semibold">Reject {{ selectedQuotes.length }} Quotes</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            You are about to reject {{ selectedQuotes.length }} quotes. This action cannot be undone.
          </p>

          <NFormGroup label="Rejection Reason" required>
            <NInput
              type="textarea"
              v-model="bulkRejectionReason"
              placeholder="Please provide a reason for rejecting these quotes..."
              :rows="3"
              :disabled="bulkProcessing"
            />
          </NFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton
              btn="ghost"
              @click="showBulkRejectModal = false"
              :disabled="bulkProcessing"
            >
              Cancel
            </NButton>
            <NButton
              color="red"
              :loading="bulkProcessing"
              @click="confirmBulkReject"
            >
              Reject All
            </NButton>
          </div>
        </template>
      </NCard>
    </NDialog>

    <AddQuoteDialog
      v-model="showEditQuoteDialog"
      :edit-quote="selectedQuote"
      @quote-updated="onQuoteUpdated"
    />
</template>

<script setup>
import { formatRelativeTime } from '~/utils/time-formatter'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Pending Quotes - Admin - Verbatims'
})

const quotes = ref([])
const loading = ref(true)
const bulkProcessing = ref(false)
const hasLoadedOnce = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
const totalPages = ref(0)
const searchQuery = ref('')
const statusFilter = ref({ label: 'Pending Review', value: 'pending' })
// Selection mode + row selection map
const selectionMode = ref(false)
const rowSelection = ref({})
const processing = ref(new Set())

const showRejectModal = ref(false)
const showBulkRejectModal = ref(false)
const showEditQuoteDialog = ref(false)
const showQuoteDialog = ref(false)
const selectedQuote = ref(null)
const rejectionReason = ref('')
const bulkRejectionReason = ref('')
const bulkOpen = ref(false)

const statusOptions = [
  { label: 'Pending Review', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

const pendingCount = computed(() => {
  return quotes.value.filter(q => q.status === 'pending').length
})

const uniqueContributors = computed(() => {
  const contributors = new Set(quotes.value.map(q => q.user_id).filter(Boolean))
  return contributors.size
})

const tableColumns = [
  {
    header: '',
    accessorKey: 'actions',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-6',
        tableCell: 'w-6'
      }
    }
  },
  {
    header: 'Quote',
    accessorKey: 'quote',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'min-w-80',
        tableCell: 'min-w-80'
      }
    }
  },
  {
    header: 'User',
    accessorKey: 'user',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-48',
        tableCell: 'w-48'
      }
    }
  },
  {
    header: 'Tags',
    accessorKey: 'tags',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  },
  {
    header: 'Status',
    accessorKey: 'status',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  },
  {
    header: 'Submitted',
    accessorKey: 'date',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-28',
        tableCell: 'w-28'
      }
    }
  }
]

const loadQuotes = async (page = 1) => {
  try {
    loading.value = true

    const params = {
      page,
      limit: pageSize.value,
      status: statusFilter.value.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch('/api/admin/quotes/pending', { query: params })

    quotes.value = response.data || []
    // Reset selection on data change
    rowSelection.value = {}
    totalQuotes.value = response.pagination?.total || 0
    pageSize.value = response.pagination?.limit || pageSize.value
    totalPages.value = response.pagination?.totalPages || Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || pageSize.value))
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load quotes:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = { label: 'Pending Review', value: 'pending' }
  currentPage.value = 1
}

// Debounced search + filter reload
watchDebounced([searchQuery, statusFilter], () => {
  currentPage.value = 1
  loadQuotes(1)
}, { debounce: 300 })

// Seamless page navigation
watch(currentPage, () => {
  loadQuotes(currentPage.value)
})

// Selection helpers (borrowed from dashboard pending page)
const clearSelection = () => {
  rowSelection.value = {}
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) clearSelection()
}

const setRowSelected = (id, value) => {
  rowSelection.value[id] = value === true
}

const visibleIds = computed(() => quotes.value.map(q => q.id))
const allSelectedOnPage = computed(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))
const selectAllOnPage = () => {
  visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

// Derive selected quote ids
const selectedQuotes = computed(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const approveQuote = async (quote) => {
  try {
    processing.value.add(quote.id)
    await $fetch(`/api/admin/quotes/${quote.id}/moderate`, {
      method: 'POST',
      body: { action: 'approve' }
    })
    
  // Remove from list if filtering by pending
  if (statusFilter.value?.value === 'pending') {
      quotes.value = quotes.value.filter(q => q.id !== quote.id)
    } else {
      // Update status in place
      const index = quotes.value.findIndex(q => q.id === quote.id)
      if (index !== -1) {
        quotes.value[index].status = 'approved'
      }
    }
  } catch (error) {
    console.error('Failed to approve quote:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: 'Failed to approve quote'
    })
  } finally {
    processing.value.delete(quote.id)
  }
}

const rejectQuote = (quote) => {
  selectedQuote.value = quote
  rejectionReason.value = ''
  showRejectModal.value = true
}

const confirmRejectQuote = async () => {
  if (!selectedQuote.value || !rejectionReason.value.trim()) return

  try {
    processing.value.add(selectedQuote.value.id)
    const response = await $fetch(`/api/admin/quotes/${selectedQuote.value.id}/moderate`, {
      method: 'POST',
      body: {
        action: 'reject',
        rejection_reason: rejectionReason.value.trim()
      }
    })

    onQuoteRejected(response.data)
    showRejectModal.value = false
    rejectionReason.value = ''
  } catch (error) {
    console.error('Failed to reject quote:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: 'Failed to reject quote'
    })
  } finally {
    processing.value.delete(selectedQuote.value.id)
  }
}

const bulkApprove = async () => {
  if (selectedQuotes.value.length === 0) return
  
  try {
    bulkProcessing.value = true
    await $fetch('/api/admin/quotes/bulk-moderate', {
      method: 'POST',
      body: {
        quote_ids: selectedQuotes.value,
        action: 'approve'
      }
    })
    
  // Remove approved quotes from list if filtering by pending
  if (statusFilter.value?.value === 'pending') {
      quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
    }
    
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk approve quotes:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: 'Failed to bulk approve quotes'
    })
  } finally {
    bulkProcessing.value = false
  }
}

const confirmBulkReject = async () => {
  if (selectedQuotes.value.length === 0 || !bulkRejectionReason.value.trim()) return

  try {
    bulkProcessing.value = true
    await $fetch('/api/admin/quotes/bulk-moderate', {
      method: 'POST',
      body: {
        quote_ids: selectedQuotes.value,
        action: 'reject',
        rejection_reason: bulkRejectionReason.value.trim()
      }
    })

    onBulkRejected()
    showBulkRejectModal.value = false
    bulkRejectionReason.value = ''
  } catch (error) {
    console.error('Failed to bulk reject quotes:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: 'Failed to bulk reject quotes'
    })
  } finally {
    bulkProcessing.value = false
  }
}

// Event handlers
const onQuoteRejected = (rejectedQuote) => {
  if (statusFilter.value?.value === 'pending') {
    quotes.value = quotes.value.filter(q => q.id !== rejectedQuote.id)
  } else {
    const index = quotes.value.findIndex(q => q.id === rejectedQuote.id)
    if (index !== -1) {
      quotes.value[index] = rejectedQuote
    }
  }
}

const onBulkRejected = () => {
  if (statusFilter.value?.value === 'pending') {
    quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
  }
  rowSelection.value = {}
}

// Utility functions
const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    default: return 'yellow'
  }
}

const getQuoteActions = (quote) => {
  const actions = [
    {
      label: 'View Details',
      leading: 'i-ph-eye',
      onclick: () => viewQuote(quote)
    },
    {
      label: 'Edit Quote',
      leading: 'i-ph-pencil',
      onclick: () => editQuote(quote)
    }
  ]

  if (quote.status === 'pending') {
    actions.push(
      {},
      {
        label: 'Approve',
        leading: 'i-ph-check',
        onclick: () => approveQuote(quote)
      },
      {
        label: 'Reject',
        leading: 'i-ph-x',
        onclick: () => rejectQuote(quote)
      }
    )
  }

  return actions
}

const viewQuote = (quote) => {
  selectedQuote.value = quote
  showQuoteDialog.value = true
}

const editQuote = (quote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = null
  // Refresh the quotes list to show updated data
  loadQuotes()
}

onMounted(() => {
  loadQuotes()
  // Keyboard shortcut: Cmd/Ctrl + A to select all (only when selection mode is active)
  const onKeydown = (e) => {
    if (!selectionMode.value) return
    const isMac = navigator.platform.toLowerCase().includes('mac')
    const metaPressed = isMac ? e.metaKey : e.ctrlKey
    if (metaPressed && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault()
      selectAllOnPage()
    }
  }
  window.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })
})

// Smoothly show/hide bulk actions based on selection
watch(selectedQuotes, (ids) => {
  bulkOpen.value = ids.length > 0
}, { immediate: true })

</script>

<style scoped>
.quotes-table-container {
  min-height: 400px;
  max-height: calc(100vh - 22rem);
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
