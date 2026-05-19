<template>
  <div class="frame flex flex-col h-full">
    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-h-0">
      <!-- First-load Skeleton State -->
      <TableFirstLoadSkeleton
        v-if="!hasLoadedOnce && loading"
        :rows="pageSize"
        :col-classes="[
          'w-12',
          'min-w-80 flex-1',
          'w-48',
          'w-24',
          'w-24',
          'w-28',
          'w-16'
        ]"
        :layout="['checkbox','multi','text','text','pill','date','dot']"
        :show-footer="true"
      />

      <!-- Empty State -->
      <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="text-center py-16">
        <NIcon name="i-ph-file-dashed" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching draft quotes' : 'No draft quotes found' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Users haven\'t created any draft quotes yet.' }}
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
              tableBody: 'bg-white dark:bg-[#0C0A09]',
            }"
            :_table-row="(row) => {
              if (!row) return {}
              const rowIdx = filteredQuotes.findIndex(q => q.id === row.id)
              const isHighlighted = rowIdx === highlightedRowIndex
              const isSelected = !!rowSelection[row.id]
              if (!isHighlighted && !isSelected) return {}
              const classes = []
              if (isHighlighted && isSelected) {
                classes.push('bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-500 dark:border-indigo-400')
                classes.push('hover:bg-indigo-200 dark:hover:bg-indigo-900/50')
              } else if (isHighlighted) {
                classes.push('bg-[#FAFAF9] dark:bg-[#1C1B1A]')
                classes.push('hover:bg-[#FAFAF9] dark:hover:bg-[#1C1B1A]')
              } else if (isSelected) {
                classes.push('bg-indigo-50/50 dark:bg-indigo-950/30 border-1.5 border-indigo-300 dark:border-indigo-700')
                classes.push('hover:bg-indigo-100 dark:hover:bg-indigo-900/40')
              }
              return {
                ...(isHighlighted ? { 'data-highlighted': 'true' } : {}),
                class: classes.join(' ')
              }
            }"
            manual-pagination
            empty-text="No draft quotes found"
            empty-icon="i-ph-file-dashed"
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
                  :checkbox="Boolean(rowSelection[cell.row.original.id]) ? 'indigo' : 'gray'"
                  :model-value="!!rowSelection[cell.row.original.id]"
                  @click="(e: any) => handleRowCheckboxClick(e, cell.row.index, cell.row.original.id)"
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
                        <NBadge badge="solid-gray" size="xs" icon="i-ph-file-dashed" class="w-full">
                          {{ totalQuotes }} Total Drafts
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-blue" size="xs" icon="i-ph-users" class="w-full">
                          {{ uniqueContributors }} Contributors
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-purple" size="xs" icon="i-ph-calendar" class="w-full">
                          {{ thisWeekCount }} This Week
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
              <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                <NButton
                  icon
                  btn="ghost-gray"
                  size="sm"
                  label="i-ph-dots-three-vertical"
                  class="hover:bg-gray-200 dark:hover:bg-gray-700/50"
                />
              </NDropdownMenu>
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
                  <span v-if="cell.row.original.author?.name">{{ cell.row.original.author.name }}</span>
                  <span v-if="cell.row.original.author?.name && cell.row.original.reference?.name">•</span>
                  <span v-if="cell.row.original.reference?.name">{{ cell.row.original.reference.name }}</span>
                </div>
              </div>
            </template>

            <!-- User Column -->
            <template #user-cell="{ cell }">
              <div class="flex items-center space-x-2">
                <NAvatar
                  :src="cell.row.original.user?.avatar"
                  :alt="cell.row.original.user?.name"
                  size="xs"
                  :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ cell.row.original.user?.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ cell.row.original.user?.email }}
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
            <template #status-cell>
              <NBadge badge="solid-orange" size="xs">
                Draft
              </NBadge>
            </template>

            <!-- Date Column -->
            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(cell.row.original.created_at) }}
              </span>
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

    <DeleteDraftDialog
      v-model:open="showDeleteModal"
      :deleting="deleting"
      @delete-draft="deleteDraft"
    />
  </div>

  <DeleteQuoteInBulkDialog
    v-model:open="showBulkDeleteModal"
    :deleting="bulkProcessing"
    :selected-quotes="selectedQuotesData"
    @bulk-delete="bulkDelete"
  />

  <BulkEditQuotesDialog
    v-model:open="showBulkEditDialog"
    :selected-quotes="selectedQuotesData"
    @updated="onBulkEditComplete"
  />

  <AddQuoteDialog
    v-model="showEditQuoteDialog"
    :edit-quote="selectedQuote"
    @quote-updated="onQuoteUpdated"
  />

  <NDialog v-model:open="showBulkSubmitModal">
    <template #header>
      <h3 class="text-lg font-semibold">Submit {{ selectedQuotes.length }} Drafts</h3>
    </template>

    <p class="text-sm text-gray-600 dark:text-gray-400">
      Are you sure you want to submit {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'draft' : 'drafts' }} for review?
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton btn="ghost-gray" :disabled="bulkProcessing" @click="showBulkSubmitModal = false">Cancel</NButton>
        <NButton btn="solid-indigo" :loading="bulkProcessing" @click="bulkSubmit(); showBulkSubmitModal = false">Submit All</NButton>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'
import { formatRelativeTime, getDateTimestamp } from '~/utils/time-formatter'
import DeleteDraftDialog from '@/components/DeleteDraftDialog.vue'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Draft Quotes - Admin - Verbatims'
})

const selectedQuote = ref<AdminQuote | null>(null)
const showQuoteDialog = ref(false)
const showEditQuoteDialog = ref(false)

const quotes = ref<AdminQuote[]>([])
const loading = ref(true)
const hasLoadedOnce = ref(false)
const searchQuery = ref('')
const selectedLanguage = ref({ label: '', value: '' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showBulkEditDialog = ref(false)
const showBulkSubmitModal = ref(false)
const deleting = ref(false)
const bulkProcessing = ref(false)

// Selection state (multi-select column)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

// Get actual quote data for selected quotes
const selectedQuotesData = computed<AdminQuote[]>(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)



const { availableLanguages } = useLanguageStore()

const languageOptions = computed(() => [
  ...((availableLanguages ?? []).map((lang: LanguageOption) => ({
    label: lang.display,
    value: lang.value
  })))
])

const totalPages = computed(() => Math.ceil(totalQuotes.value / pageSize.value))

const filteredQuotes = computed(() => {
  let filtered = quotes.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote =>
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query) ||
      quote.user?.name?.toLowerCase().includes(query)
    )
  }

  if (selectedLanguage.value.value) {
    filtered = filtered.filter(quote => quote.language === selectedLanguage.value.value)
  }

  return filtered
})

const uniqueContributors = computed(() => {
  const contributors = new Set(quotes.value.map(q => q.user_id).filter(Boolean))
  return contributors.size
})

const thisWeekCount = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return quotes.value.filter(q => getDateTimestamp(q.created_at) >= oneWeekAgo.getTime()).length
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

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSelection: Record<number, boolean> = {}
    filteredQuotes.value.forEach(q => { newSelection[q.id] = true })
    rowSelection.value = newSelection
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
  showQuoteDialog.value || showDeleteModal.value || showBulkDeleteModal.value ||
  showBulkEditDialog.value || showEditQuoteDialog.value || showBulkSubmitModal.value
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
  onSubmit: () => { showBulkSubmitModal.value = true },
  onDelete: () => { showBulkDeleteModal.value = true },
  onConfirmDialog: () => {
    if (showBulkDeleteModal.value) bulkDelete()
    else if (showBulkSubmitModal.value) { bulkSubmit(); showBulkSubmitModal.value = false }
    else if (showDeleteModal.value) deleteDraft()
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  onSingleSubmit: () => {
    if (highlightedQuote.value) submitForReview(highlightedQuote.value)
  },
  onSingleDelete: () => {
    if (highlightedQuote.value) confirmDelete(highlightedQuote.value)
  }
})

// handle shift‑click range selection
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
      label: 'Submit Selected',
      leading: 'i-ph-paper-plane-tilt',
      shortcut: 'S',
      onclick: () => bulkSubmit()
    })
    actions.push({
      label: 'Delete Selected',
      leading: 'i-ph-trash',
      shortcut: 'D',
      onclick: () => { showBulkDeleteModal.value = true }
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
        tableHead: 'w-24',
        tableCell: 'w-24'
      }
    }
  },
  {
    header: 'Created',
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

const loadQuotes = async (page = currentPage.value) => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/quotes', {
      query: {
        status: 'draft',
  page,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        language: selectedLanguage.value.value || undefined
      }
    })

    quotes.value = (response.data as any) || []
    totalQuotes.value = response.pagination?.total || 0
    rowSelection.value = {}
    lastSelectedIndex.value = null
    clearHighlight()
    // Update current page and total pages
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load draft quotes:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error Loading Draft Quotes',
      description: 'Failed to load draft quotes. Please try again later.'
    })
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = { label: '', value: '' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes(1)
}

const getQuoteActions = (quote: AdminQuote) => [
  {
    label: 'View Details',
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  },
  {
    label: 'Edit Quote',
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {
    label: 'Submit for Review',
    leading: 'i-ph-paper-plane-tilt',
    onclick: () => submitForReview(quote)
  },
  {},
  {
    label: 'Delete Draft',
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(quote)
  }
]

const viewQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showQuoteDialog.value = true
}

const editQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const submitForReview = async (quote: AdminQuote) => {
  const previousHighlightedIndex = highlightedRowIndex.value
  try {
    await $fetch(`/api/admin/quotes/${quote.id}/submit`, {
      method: 'POST'
    } as any)

    quotes.value = quotes.value.filter(q => q.id !== quote.id)
    repositionHighlightAfterRemoval(previousHighlightedIndex)
  } catch (error) {
    console.error('Failed to submit draft for review:', error)
    useToast().toast({
      toast: 'error',
      title: 'Submission Failed',
      description: 'Could not submit the draft. Please try again.'
    })
  }
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

const confirmDelete = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showDeleteModal.value = true
}

const deleteDraft = async () => {
  if (!selectedQuote.value) return

  const previousHighlightedIndex = highlightedRowIndex.value

  deleting.value = true
  try {
    await $fetch(`/api/quotes/${selectedQuote.value.id}`, {
      method: 'DELETE'
    } as any)

    // Remove from list
    quotes.value = quotes.value.filter(q => q.id !== selectedQuote.value?.id)
    showDeleteModal.value = false
    selectedQuote.value = null

    repositionHighlightAfterRemoval(previousHighlightedIndex)

    useToast().toast({
      toast: 'success',
      title: 'Draft Deleted',
      description: 'The draft has been successfully deleted.'
    })
  } catch (error) {
    console.error('Failed to delete draft:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error Deleting Draft',
      description: 'Failed to delete the draft. Please try again.'
    })
  } finally {
    deleting.value = false
  }
}


const bulkDelete = async () => {
  if (selectedQuotes.value.length === 0) return
  const { toast } = useToast()
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    const batchSize = 5
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await Promise.all(batch.map(id => $fetch(`/api/quotes/${id}`, { method: 'DELETE' } as any)))
    }
    quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
    rowSelection.value = {}
    showBulkDeleteModal.value = false
    toast({ title: 'Deleted', description: 'Selected drafts deleted.' })
  } catch (error) {
    console.error('Failed to bulk delete:', error)
    useToast().toast({
      toast: 'error',
      title: 'Bulk Delete Failed',
      description: 'Please try again.'
    })
  } finally {
    bulkProcessing.value = false
  }
}

const bulkSubmit = async () => {
  if (selectedQuotes.value.length === 0) return
  const { toast } = useToast()
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    await $fetch('/api/admin/quotes/bulk-submit', {
      method: 'POST',
      body: { quote_ids: ids }
    } as any)

    // Remove submitted IDs from current list and clear selection
    quotes.value = quotes.value.filter(q => !ids.includes(q.id))
    rowSelection.value = {}

    toast({ title: 'Submitted', description: 'Selected drafts submitted for review.' })
  } catch (error) {
    console.error('Failed to bulk submit drafts:', error)
    useToast().toast({
      toast: 'error',
      title: 'Bulk Submit Failed',
      description: 'Please try again.'
    })
  } finally {
    bulkProcessing.value = false
  }
}

watch(currentPage, () => {
  loadQuotes(currentPage.value)
})

watchDebounced([searchQuery, selectedLanguage], () => {
  currentPage.value = 1
  loadQuotes(1)
}, { debounce: 300 })

onMounted(() => {
  loadQuotes()
})

onBeforeUnmount(() => {
  // nothing to clean up
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
