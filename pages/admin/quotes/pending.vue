<template>
  <div class="frame flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Pending Quotes
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Review and moderate submitted quotes awaiting approval.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search quotes, authors, or users..."
            icon="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
            @input="debouncedSearch"
          />
        </div>
        <div class="flex gap-2">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="Filter by status"
            size="md"
            class="w-40"
            @change="loadQuotes"
          />
          <UButton
            btn="outline"
            size="md"
            @click="resetFilters"
          >
            <UIcon name="i-ph-x" />
            Reset
          </UButton>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-clock" class="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pendingCount }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selected</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ selectedQuotes.length }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-users" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Contributors</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ uniqueContributors }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedQuotes.length > 0" class="flex-shrink-0 mb-6">
      <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ selectedQuotes.length }} quotes selected
          </span>
          <div class="flex items-center gap-3">
            <UButton
              size="sm"
              btn="solid"
              :loading="bulkProcessing"
              @click="bulkApprove"
            >
              <UIcon name="i-ph-check" />
              Approve Selected
            </UButton>
            <UButton
              size="sm"
              btn="solid"
              color="red"
              :loading="bulkProcessing"
              @click="showBulkRejectModal = true"
            >
              <UIcon name="i-ph-x" />
              Reject Selected
            </UButton>
            <UButton
              size="sm"
              btn="ghost"
              @click="clearSelection"
            >
              Clear Selection
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-h-0">

      <!-- Loading State -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <UIcon name="i-ph-spinner" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">Loading pending quotes...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="quotes.length === 0 && !loading" class="text-center py-16">
        <UIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching quotes found' : 'All caught up!' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'No pending quotes to review at the moment.' }}
        </p>
      </div>

      <!-- Quotes Table -->
      <div v-else class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
        <!-- Scrollable Table Container -->
        <div class="quotes-table-container flex-1 overflow-auto">
          <UTable
            :columns="tableColumns"
            :data="quotes"
            :loading="loading"
            empty-text="No pending quotes found"
            empty-icon="i-ph-clock"
          >
            <!-- Selection Column -->
            <template #selection-cell="{ cell }">
              <UCheckbox
                :model-value="selectedQuotes.includes(cell.row.original.id)"
                @update:model-value="toggleQuoteSelection(cell.row.original.id)"
              />
            </template>

            <!-- Quote Column with text wrapping -->
            <template #quote-cell="{ cell }">
              <div class="max-w-md">
                <blockquote
                  class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-normal break-words mb-2"
                  :title="cell.row.original.name"
                >
                  "{{ cell.row.original.name }}"
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
                <UAvatar
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
                <UBadge
                  v-for="tag in cell.row.original.tags.slice(0, 2)"
                  :key="tag.name"
                  :style="{ backgroundColor: tag.color }"
                  variant="soft"
                  size="xs"
                >
                  {{ tag.name }}
                </UBadge>
                <UBadge
                  v-if="cell.row.original.tags.length > 2"
                  variant="soft"
                  size="xs"
                  color="gray"
                >
                  +{{ cell.row.original.tags.length - 2 }}
                </UBadge>
              </div>
              <span v-else class="text-xs text-gray-400 dark:text-gray-600 italic">
                No tags
              </span>
            </template>

            <!-- Status Column -->
            <template #status-cell="{ cell }">
              <div class="space-y-1">
                <UBadge :color="getStatusColor(cell.row.original.status)" variant="subtle" size="xs">
                  {{ cell.row.original.status }}
                </UBadge>
                <div v-if="cell.row.original.status === 'rejected' && cell.row.original.rejection_reason" class="text-xs text-red-600 dark:text-red-400">
                  {{ cell.row.original.rejection_reason.substring(0, 30) }}{{ cell.row.original.rejection_reason.length > 30 ? '...' : '' }}
                </div>
              </div>
            </template>

            <!-- Date Column -->
            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(cell.row.original.created_at) }}
              </span>
            </template>

            <!-- Actions Column -->
            <template #actions-cell="{ cell }">
              <UDropdownMenu :items="getQuoteActions(cell.row.original)">
                <UButton
                  icon
                  btn="ghost"
                  size="sm"
                  label="i-ph-dots-three-vertical"
                />
              </UDropdownMenu>
            </template>
          </UTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 flex items-center justify-between p-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Page {{ currentPage }} of {{ Math.ceil(totalQuotes / pageSize) }} • {{ totalQuotes }} total quotes
          </div>
          <div class="flex items-center gap-2">
            <UButton
              v-if="hasMore && !loading"
              btn="outline"
              size="sm"
              :loading="loadingMore"
              @click="loadMore"
            >
              Load More
            </UButton>
          </div>
        </div>
      </div>
    </div>

  </div>

    <!-- Reject Quote Modal -->
    <UDialog v-model:open="showRejectModal">
      <UCard>
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

          <UFormGroup label="Rejection Reason" required>
            <UInput
              type="textarea"
              v-model="rejectionReason"
              placeholder="Please provide a reason for rejecting this quote..."
              :rows="3"
              :disabled="processing.has(selectedQuote?.id)"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              btn="ghost"
              @click="showRejectModal = false"
              :disabled="processing.has(selectedQuote?.id)"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="processing.has(selectedQuote?.id)"
              @click="confirmRejectQuote"
            >
              Reject Quote
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <!-- Bulk Reject Modal -->
    <UDialog v-model:open="showBulkRejectModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Reject {{ selectedQuotes.length }} Quotes</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            You are about to reject {{ selectedQuotes.length }} quotes. This action cannot be undone.
          </p>

          <UFormGroup label="Rejection Reason" required>
            <UInput
              type="textarea"
              v-model="bulkRejectionReason"
              placeholder="Please provide a reason for rejecting these quotes..."
              :rows="3"
              :disabled="bulkProcessing"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              btn="ghost"
              @click="showBulkRejectModal = false"
              :disabled="bulkProcessing"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="bulkProcessing"
              @click="confirmBulkReject"
            >
              Reject All
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
</template>

<script setup>
// Use admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// SEO
useHead({
  title: 'Pending Quotes - Admin - Verbatims'
})

// Data
const quotes = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const bulkProcessing = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(50) // Admin default: 50 items per page
const totalQuotes = ref(0)
const searchQuery = ref('')
const statusFilter = ref('draft')
const selectedQuotes = ref([])
const processing = ref(new Set())

// Modals
const showRejectModal = ref(false)
const showBulkRejectModal = ref(false)
const selectedQuote = ref(null)
const rejectionReason = ref('')
const bulkRejectionReason = ref('')

// Options
const statusOptions = [
  { label: 'Pending Review', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

// Computed properties
const pendingCount = computed(() => {
  return quotes.value.filter(q => q.status === 'draft').length
})

const uniqueContributors = computed(() => {
  const contributors = new Set(quotes.value.map(q => q.user_id).filter(Boolean))
  return contributors.size
})

// Table columns configuration
const tableColumns = [
  {
    header: '',
    accessorKey: 'selection',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-12',
        tableCell: 'w-12'
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
  },
  {
    header: '',
    accessorKey: 'actions',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-16',
        tableCell: 'w-16'
      }
    }
  }
]

// Methods
const loadQuotes = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      selectedQuotes.value = []
    } else {
      loadingMore.value = true
    }

    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch('/api/admin/quotes/pending', { query: params })

    if (reset) {
      quotes.value = response.data || []
    } else {
      quotes.value.push(...(response.data || []))
    }

    totalQuotes.value = response.total || 0
    hasMore.value = response.pagination?.hasMore || false
  } catch (error) {
    console.error('Failed to load quotes:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'draft'
  currentPage.value = 1
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  loadQuotes()
}, 300)

// Load more quotes
const loadMore = () => {
  currentPage.value++
  loadQuotes(false)
}

// Quote selection
const toggleQuoteSelection = (quoteId) => {
  const index = selectedQuotes.value.indexOf(quoteId)
  if (index > -1) {
    selectedQuotes.value.splice(index, 1)
  } else {
    selectedQuotes.value.push(quoteId)
  }
}

const clearSelection = () => {
  selectedQuotes.value = []
}

// Individual quote actions
const approveQuote = async (quote) => {
  try {
    processing.value.add(quote.id)
    await $fetch(`/api/admin/quotes/${quote.id}/moderate`, {
      method: 'POST',
      body: { action: 'approve' }
    })
    
    // Remove from list if filtering by draft
    if (statusFilter.value === 'draft') {
      quotes.value = quotes.value.filter(q => q.id !== quote.id)
    } else {
      // Update status in place
      const index = quotes.value.findIndex(q => q.id === quote.id)
      if (index !== -1) {
        quotes.value[index].status = 'approved'
      }
    }
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to approve quote:', error)
    // TODO: Show error toast
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

    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to reject quote:', error)
    // TODO: Show error toast
  } finally {
    processing.value.delete(selectedQuote.value.id)
  }
}

// Bulk actions
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
    
    // Remove approved quotes from list if filtering by draft
    if (statusFilter.value === 'draft') {
      quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
    }
    
    selectedQuotes.value = []
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to bulk approve quotes:', error)
    // TODO: Show error toast
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

    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to bulk reject quotes:', error)
    // TODO: Show error toast
  } finally {
    bulkProcessing.value = false
  }
}

// Event handlers
const onQuoteRejected = (rejectedQuote) => {
  if (statusFilter.value === 'draft') {
    quotes.value = quotes.value.filter(q => q.id !== rejectedQuote.id)
  } else {
    const index = quotes.value.findIndex(q => q.id === rejectedQuote.id)
    if (index !== -1) {
      quotes.value[index] = rejectedQuote
    }
  }
}

const onBulkRejected = () => {
  if (statusFilter.value === 'draft') {
    quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
  }
  selectedQuotes.value = []
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
      click: () => viewQuote(quote)
    },
    {
      label: 'Edit Quote',
      leading: 'i-ph-pencil',
      click: () => editQuote(quote)
    }
  ]

  if (quote.status === 'draft') {
    actions.push(
      {},
      {
        label: 'Approve',
        leading: 'i-ph-check',
        click: () => approveQuote(quote)
      },
      {
        label: 'Reject',
        leading: 'i-ph-x',
        click: () => rejectQuote(quote)
      }
    )
  }

  return actions
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const viewQuote = (quote) => {
  // TODO: Open quote detail modal
  console.log('View quote:', quote.id)
}

const editQuote = (quote) => {
  // TODO: Open quote edit modal
  console.log('Edit quote:', quote.id)
}

// Load initial data
onMounted(() => {
  loadQuotes()
})

// Watch for status filter changes
watch(statusFilter, () => {
  loadQuotes()
})
</script>

<style scoped>
.quotes-table-container {
  min-height: 400px;
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
