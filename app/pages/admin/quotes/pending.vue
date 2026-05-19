<template>
  <div class="frame flex flex-col h-full">
    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- First-load Skeleton State -->
      <TableFirstLoadSkeleton
        v-if="!hasLoadedOnce && loading"
        :rows="pageSize"
        :col-classes="[
          'min-w-80 flex-1',
          'w-48',
          'w-24',
          'w-32',
          'w-28',
          'w-6'
        ]"
        :layout="['multi','multi','text','pill','date','dot']"
        :show-footer="true"
      />

      <!-- Empty State -->
      <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="text-center py-16">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching quotes found' : 'All caught up!' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'No pending quotes to review at the moment.' }}
        </p>
      </div>

      <!-- Quotes Table -->
      <div v-else class="flex-1 flex flex-col">
        <!-- Scrollable Table Container -->
        <div class="group quotes-table-container flex-1 overflow-auto border rounded-2">
          <NTable
            :columns="tableColumns"
            :data="filteredQuotes"
            :loading="loading"
            :una="{
              tableRoot: '!overflow-visible border-none',
              scrollAreaRoot: '!overflow-visible',
              table: '!w-auto min-w-full',
              tableHeader: 'sticky top-0 z-1 bg-[#FAFAF9] dark:bg-[#0C0A09]',
              tableBody: 'bg-white dark:bg-[#0C0A09]'
            }"
            :_table-row="(row) => {
              if (!row) return {}
              const rowIdx = filteredQuotes.findIndex(q => q.id === row.id)
              const isHighlighted = rowIdx === highlightedRowIndex
              const isSelected = !!rowSelection[row.id]
              if (!isHighlighted && !isSelected) return {}
              const classes = []
              if (isHighlighted && isSelected) {
                classes.push('bg-indigo-100 dark:bg-indigo-900/40 border-l-2 border-indigo-500 dark:border-indigo-400')
              } else if (isHighlighted) {
                classes.push('bg-[#FAFAF9] dark:bg-[#1C1B1A]')
              } else if (isSelected) {
                classes.push('bg-indigo-50/50 dark:bg-indigo-950/30 border-l-2 border-indigo-300 dark:border-indigo-700')
              }
              return {
                ...(isHighlighted ? { 'data-highlighted': 'true' } : {}),
                class: classes.join(' ')
              }
            }"
            manual-pagination
            empty-text="No pending quotes found"
            empty-icon="i-ph-clock"
          >
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

            <template #quote-header>
              <div class="flex items-center gap-4">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Name</h4>
                <div class="w-102">
                  <NInput
                    v-model="searchQuery"
                    placeholder="Search quotes, authors, or users..."
                    leading="i-ph-magnifying-glass"
                    size="md"
                    :loading="loading"
                    :trailing="searchQuery ? 'i-ph-x' : undefined"
                    :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                    @trailing="resetFilters"
                  />
                </div>
              </div>
            </template>

            <template #language-header>
              <div>
                <NSelect
                  v-model="selectedLanguage"
                  :items="languageOptions"
                  placeholder="All Languages"
                  size="sm"
                  item-key="label"
                  value-key="label"
                />
              </div>
            </template>

            <template #status-header>
              <div>
                <NSelect
                  v-model="statusFilter"
                  :items="statusOptions"
                  placeholder="Filter by status"
                  size="sm"
                  item-key="label"
                  value-key="label"
                />
              </div>
            </template>

            <template #actions-header>
              <div class="flex items-center justify-center space-x-1">
                <span v-if="selectedQuotes.length > 0">{{ selectedQuotes.length }}</span>
                <NTooltip :_tooltip-content="{ class: 'py-2 light:bg-gray-100 dark:bg-gray-950 light:b-gray-2 dark:b-gray-9 shadow-lg dark:shadow-gray-800/50' }">
                  <template #default>
                    <NIcon name="i-ph-info" class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                  </template>
                  <template #content>
                    <div class="space-y-2">
                      <div class="flex">
                        <NBadge badge="solid-yellow" size="xs" icon="i-ph-clock" class="w-full">
                          {{ pendingCount }} Pending
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-green" size="xs" icon="i-ph-check-circle" class="w-full">
                          {{ selectedQuotes.length }} Selected
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-blue" size="xs" icon="i-ph-users" class="w-full">
                          {{ uniqueContributors }} Contributors
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

            <!-- Language Column -->
            <template #language-cell="{ cell }">
              <span class="text-sm text-gray-900 dark:text-white">
                {{ cell.row.original.language || 'N/A' }}
              </span>
            </template>

            <!-- Status Column -->
            <template #status-cell="{ cell }">
              <div class="space-y-1">
                <NBadge badge="solid-yellow" size="xs">
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
              <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                <NButton
                  icon
                  btn="ghost-gray"
                  size="xs"
                  label="i-ph-dots-three-vertical"
                  class="hover:bg-gray-200 dark:hover:bg-gray-700/50"
                />
              </NDropdownMenu>
            </template>
          </NTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 flex items-center justify-between p-4">
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
            pagination-selected="solid-indigo"
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
    </NDialog>

    <!-- Bulk Reject Modal -->
    <NDialog v-model:open="showBulkRejectModal">
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
            btn="ghost-gray"
            @click="showBulkRejectModal = false"
            :disabled="bulkProcessing"
          >
            Cancel
          </NButton>
          <NButton
            btn="solid-indigo"
            :loading="bulkProcessing"
            @click="confirmBulkReject"
          >
            Reject All
          </NButton>
        </div>
      </template>
    </NDialog>

    <AddQuoteDialog
      v-model="showEditQuoteDialog"
      :edit-quote="selectedQuote"
      @quote-updated="onQuoteUpdated"
    />

    <BulkEditQuotesDialog
      v-model:open="showBulkEditDialog"
      :selected-quotes="selectedQuotesData"
      @updated="onBulkEditComplete"
    />

    <NDialog v-model:open="showBulkApproveModal">
      <template #header>
        <h3 class="text-lg font-semibold">Approve {{ selectedQuotes.length }} Quotes</h3>
      </template>

      <p class="text-sm text-gray-600 dark:text-gray-400">
        Are you sure you want to approve {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }}?
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="ghost-gray" :disabled="bulkProcessing" @click="showBulkApproveModal = false">Cancel</NButton>
          <NButton btn="solid-green" :loading="bulkProcessing" @click="bulkApprove(); showBulkApproveModal = false">Approve All</NButton>
        </div>
      </template>
    </NDialog>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import type { LanguageOption } from '~/stores/language'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'

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
const selectedLanguage = ref({ label: '', value: '' })
// row selection map (multi-select)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const processing = ref(new Set())

const showRejectModal = ref(false)
const showBulkRejectModal = ref(false)
const showBulkEditDialog = ref(false)
const showBulkApproveModal = ref(false)
const showEditQuoteDialog = ref(false)
const showQuoteDialog = ref(false)
const selectedQuote = ref(null)
const rejectionReason = ref('')
const bulkRejectionReason = ref('')

const statusOptions = [
  { label: 'Pending Review', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

const { availableLanguages } = useLanguageStore()
const languageOptions = computed(() => [
  ...((availableLanguages ?? []).map((lang: LanguageOption) => ({
    label: lang.display,
    value: lang.value
  })))
])

// selection helpers & stats
const pendingCount = computed(() => {
  return quotes.value.filter(q => q.status === 'pending').length
})

const uniqueContributors = computed(() => {
  const contributors = new Set(quotes.value.map(q => q.user_id).filter(Boolean))
  return contributors.size
})

const filteredQuotes = computed(() => {
  let filtered = quotes.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(q =>
      q.name.toLowerCase().includes(query) ||
      q.author_name?.toLowerCase().includes(query) ||
      q.reference_name?.toLowerCase().includes(query) ||
      q.user_name?.toLowerCase().includes(query)
    )
  }
  if (statusFilter.value.value) {
    filtered = filtered.filter(q => q.status === statusFilter.value.value)
  }
  if (selectedLanguage.value.value) {
    filtered = filtered.filter(q => q.language === selectedLanguage.value.value)
  }
  return filtered
})

// helpers for table multi-select
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = filteredQuotes.value.length
    const count = selectedQuotes.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      filteredQuotes.value.forEach(q => { newSelection[q.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null
  }
})

const setRowSelected = (id, value) => { rowSelection.value[id] = value === true }
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSel: Record<number, boolean> = {}
    filteredQuotes.value.forEach(q => { newSel[q.id] = true })
    rowSelection.value = newSel
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const selectAllOnPage = () => {
  if (allSelectedOnPage.value) rowSelection.value = {}
  else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const isAnyDialogOpen = computed(() =>
  showQuoteDialog.value || showRejectModal.value || showBulkRejectModal.value ||
  showBulkEditDialog.value || showEditQuoteDialog.value || showBulkApproveModal.value
)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => filteredQuotes.value.length,
  onSelectRow: (index: number) => {
    const quote = filteredQuotes.value[index]
    if (quote) {
      rowSelection.value[quote.id] = !rowSelection.value[quote.id]
      lastSelectedIndex.value = null
    }
  },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false
})

const highlightedQuote = computed<AdminQuote | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return filteredQuotes.value[highlightedRowIndex.value] ?? null
})

function repositionHighlightAfterRemoval(previousIndex: number | null) {
  if (previousIndex === null) return
  nextTick(() => {
    const count = filteredQuotes.value.length
    if (count === 0) {
      highlightedRowIndex.value = null
    } else {
      highlightedRowIndex.value = Math.min(Math.max(0, previousIndex - 1), count - 1)
    }
  })
}

useAdminKeyboardShortcuts({
  selectAllOnPage,
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onEdit: () => { showBulkEditDialog.value = true },
  customKeys: {
    a: () => { showBulkApproveModal.value = true },
    r: () => { showBulkRejectModal.value = true }
  },
  onConfirmDialog: () => {
    if (showBulkRejectModal.value) confirmBulkReject()
    else if (showBulkApproveModal.value) { bulkApprove(); showBulkApproveModal.value = false }
    else if (showRejectModal.value) confirmRejectQuote()
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  customSingleKeys: {
    a: () => {
      if (highlightedQuote.value) {
        const previousIndex = highlightedRowIndex.value
        approveQuote(highlightedQuote.value).then(() => repositionHighlightAfterRemoval(previousIndex))
      }
    },
    r: () => {
      if (highlightedQuote.value) quickRejectQuote(highlightedQuote.value)
    }
  }
})

// shift‑click support
const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = filteredQuotes.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }
  lastSelectedIndex.value = index
}

// derive selected ids
const selectedQuotes = computed(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)

const headerActions = computed(() => {
  const actions: any[] = []
  if (selectedQuotes.value.length > 0) {
    actions.push({
      label: 'Edit Selected',
      leading: 'i-ph-pencil',
      shortcut: 'E',
      onclick: () => { showBulkEditDialog.value = true }
    })
    actions.push({
      label: 'Approve Selected',
      leading: 'i-ph-check',
      shortcut: 'A',
      onclick: () => bulkApprove()
    })
    actions.push({
      label: 'Reject Selected',
      leading: 'i-ph-x',
      shortcut: 'R',
      onclick: () => { showBulkRejectModal.value = true }
    })
  }
  if (actions.length > 0) actions.push({})
  actions.push({
    label: 'Refresh',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadQuotes()
  })
  actions.push({
    label: 'Reset Filters',
    leading: 'i-ph-x',
    onclick: () => resetFilters()
  })
  return actions
})

const tableColumns = [
  { header: '', accessorKey: 'select', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
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
    header: 'Language',
    accessorKey: 'language',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-24',
        tableCell: 'w-24'
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
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } }
]


const loadQuotes = async (page = 1) => {
  try {
    loading.value = true

    const params: any = {
      page,
      limit: pageSize.value,
      status: statusFilter.value.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (selectedLanguage.value.value) {
      params.language = selectedLanguage.value.value
    }

    const response = await $fetch('/api/admin/quotes/pending', { query: params })

    quotes.value = response.data || []
    // Reset selection on data change
    rowSelection.value = {}
    clearHighlight()
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
  selectedLanguage.value = { label: '', value: '' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

// Debounced search + filter reload
watchDebounced([searchQuery, statusFilter, selectedLanguage], () => {
  currentPage.value = 1
  loadQuotes(1)
}, { debounce: 300 })

// Seamless page navigation
watch(currentPage, () => {
  loadQuotes(currentPage.value)
})



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

const quickRejectQuote = async (quote: AdminQuote) => {
  const previousIndex = highlightedRowIndex.value
  try {
    processing.value.add(quote.id)
    const response = await $fetch(`/api/admin/quotes/${quote.id}/moderate`, {
      method: 'POST',
      body: { action: 'reject', rejection_reason: '' }
    })
    onQuoteRejected(response.data)
    repositionHighlightAfterRemoval(previousIndex)
  } catch (error) {
    console.error('Failed to reject quote:', error)
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to reject quote' })
  } finally {
    processing.value.delete(quote.id)
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

const getQuoteActions = (quote): any[] => {
  const actions: any[] = [
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
  loadQuotes()
}

const onBulkEditComplete = () => {
  showBulkEditDialog.value = false
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes()
}

onMounted(() => {
  loadQuotes()

})



</script>

<style scoped>
.quotes-table-container {
  min-height: 400px;
  max-height: calc(100vh - 11rem);
  max-width: calc(100vw - 8rem);
}

:deep(.table-header tr) {
  border-bottom: none;
}

.quotes-table-container :deep([data-reka-scroll-area-viewport]) {
  overflow: visible !important;
}

.quotes-table-container :deep([data-reka-scroll-area-corner]) {
  display: none !important;
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
