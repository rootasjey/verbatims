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
          'w-40',
          'w-40',
          'w-32',
          'w-24',
          'w-24',
          'w-28'
        ]"
        :layout="['checkbox','multi','text','text','text','pill','date','dot']"
        :show-footer="true"
      />

      <!-- Empty State -->
      <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="text-center py-16">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching published quotes' : 'No published quotes yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Published quotes will appear here once users submit and quotes are approved.' }}
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
            empty-text="No published quotes found"
            empty-icon="i-ph-check-circle"
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
                    placeholder="Search quotes, authors, or references..."
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
                        <NBadge badge="solid-gray" size="xs" icon="i-ph-check-circle" class="w-full">
                          {{ totalQuotes }} Published
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-blue" size="xs" icon="i-ph-eye" class="w-full">
                          {{ totalViews }} Views
                        </NBadge>
                      </div>
                      <div class="flex">
                        <NBadge badge="solid-red" size="xs" icon="i-ph-heart" class="w-full">
                          {{ totalLikes }} Likes
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
                  size="xs"
                  label="i-ph-dots-three-vertical"
                  class="hover:bg-gray-200 dark:hover:bg-gray-700/50"
                />
              </NDropdownMenu>
            </template>

            <!-- Quote Column with author/reference info -->
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
              <div class="text-sm">
                <span v-if="cell.row.original.user_name" class="text-gray-900 dark:text-white">
                  {{ cell.row.original.user_name }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-600 italic">
                  Unknown
                </span>
              </div>
            </template>

            <!-- Language Column -->
            <template #language-cell="{ cell }">
              <span class="text-sm text-gray-900 dark:text-white">
                {{ cell.row.original.language || 'N/A' }}
              </span>
            </template>

            <!-- Stats Column -->
            <template #stats-cell="{ cell }">
              <div class="text-xs space-y-1">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <NIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
                  {{ cell.row.original.views_count || 0 }}
                </div>
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <NIcon name="i-ph-heart" class="w-3 h-3 mr-1" />
                  {{ cell.row.original.likes_count || 0 }}
                </div>
              </div>
            </template>

            <!-- Status Column -->
            <template #status-cell>
              <NBadge badge="solid-lime" size="xs">
                Published
              </NBadge>
            </template>

            <!-- Published Date Column -->
            <template #published-cell="{ cell }">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(cell.row.original.moderated_at || cell.row.original.created_at) }}
              </span>
            </template>
          </NTable>
        </div>

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
  </div>

  <AddQuoteDialog
    v-model="showEditQuoteDialog"
    :edit-quote="selectedQuote"
    @quote-updated="onQuoteUpdated"
  />

  <!-- Bulk Add to Collection Modal -->
  <AddToCollectionBulkModal
    v-if="selectedQuotes.length > 0"
    v-model="showBulkAddToCollection"
    :quote-ids="selectedQuotes"
    @added="handleBulkAddedToCollection"
  />

  <BulkEditQuotesDialog
    v-model:open="showBulkEditDialog"
    :selected-quotes="selectedQuotesData"
    @updated="onBulkEditComplete"
  />

  <NDialog v-model:open="showBulkUnpublishModal">
    <template #header>
      <h3 class="text-lg font-semibold">Unpublish {{ selectedQuotes.length }} Quotes</h3>
    </template>

    <p class="text-sm text-gray-600 dark:text-gray-400">
      Are you sure you want to unpublish {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }}?
      They will be moved back to drafts.
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton btn="ghost-gray" @click="showBulkUnpublishModal = false">Cancel</NButton>
        <NButton btn="solid-orange" @click="bulkUnpublish(); showBulkUnpublishModal = false">Unpublish All</NButton>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'
import { formatRelativeTime, getDateTimestamp } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Published Quotes - Admin - Verbatims'
})

const quotes = ref<AdminQuote[]>([])
const loading = ref(true)
const hasLoadedOnce = ref(false)
const searchQuery = ref('')
const selectedSort = ref({ label: 'Most Recent', value: 'newest' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)

const languageStore = useLanguageStore()
const languageOptions = computed(() =>
  languageStore.availableLanguages.map((lang: LanguageOption) => ({
    label: lang.display,
    value: lang.value === 'all' ? '' : lang.value // Map 'all' to empty string for filter logic
  }))
)

const selectedLanguage = ref({ label: 'All Languages', value: '' })

const selectedQuote = ref<AdminQuote | undefined>(undefined)
const showEditQuoteDialog = ref(false)
// Selection state (multi-select column)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed<AdminQuote[]>(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)
// Bulk modal
const showBulkAddToCollection = ref(false)
const showBulkEditDialog = ref(false)
const showBulkUnpublishModal = ref(false)

const sortOptions = [
  { label: 'Most Recent', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Liked', value: 'likes' },
  { label: 'Most Viewed', value: 'views' }
]

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

  // Apply sorting
  if (selectedSort.value.value) {
    filtered = [...filtered].sort((a, b) => {
      switch (selectedSort.value.value) {
        case 'newest':
          return getDateTimestamp(b.moderated_at || b.created_at) - getDateTimestamp(a.moderated_at || a.created_at)
        case 'oldest':
          return getDateTimestamp(a.moderated_at || a.created_at) - getDateTimestamp(b.moderated_at || b.created_at)
        case 'likes':
          return (b.likes_count || 0) - (a.likes_count || 0)
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0)
        default:
          return 0
      }
    })
  }

  return filtered
})

const totalViews = computed(() => {
  return quotes.value.reduce((sum, quote) => sum + (quote.views_count || 0), 0)
})

const totalLikes = computed(() => {
  return quotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
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
    header: 'Language',
    accessorKey: 'language',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  },
  {
    header: 'User',
    accessorKey: 'user',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  },
  {
    header: 'Stats',
    accessorKey: 'stats',
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
    header: 'Published',
    accessorKey: 'published',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-28',
        tableCell: 'w-28'
      }
    }
  },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } }
]

// Helpers derived from dashboard page
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
    const newSel: Record<number, boolean> = {}
    if (v === true) {
      filteredQuotes.value.forEach(q => { newSel[q.id] = true })
    }
    rowSelection.value = newSel
    lastSelectedIndex.value = null
  }
})

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

const loadQuotes = async () => {
  try {
    loading.value = true
    type AdminQuotesResponse = {
      success: boolean
      data: AdminQuote[]
      pagination?: { total?: number }
    }

    const response = await $fetch<AdminQuotesResponse>('/api/admin/quotes', {
      query: {
        status: 'approved',
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        language: selectedLanguage.value.value || undefined
      }
    })

    quotes.value = response.data || []
    totalQuotes.value = response.pagination?.total || 0
    // Reset selection on new data
    rowSelection.value = {}
    clearHighlight()
  } catch (error) {
    console.error('Failed to load published quotes:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to load published quotes',
      toast: 'error'
    })
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = languageOptions.value[0] // Use the first option from the store (All Languages)
  selectedSort.value = { label: 'Most Recent', value: 'newest' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

const getQuoteActions = (quote: AdminQuote) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  },
  {
    label: 'Edit Quote',
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {},
  {
    label: 'Unpublish',
    leading: 'i-ph-eye-slash',
    onclick: () => unpublishQuote(quote)
  }
]

const viewQuote = (quote: AdminQuote) => {
  navigateTo(`/quotes/${quote.id}`)
}

const editQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = undefined
  loadQuotes()
}

const onBulkEditComplete = () => {
  showBulkEditDialog.value = false
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes()
}

const unpublishQuote = async (quote: AdminQuote) => {
  try {
    const res = await $fetch('/api/admin/quotes/unpublish', {
      method: 'POST',
      body: { id: quote.id }
    })
    useToast().toast({
      title: 'Quote unpublished',
      description: `Quote #${quote.id} moved back to draft`,
      toast: 'success'
    })
    await loadQuotes()
  } catch (e) {
    console.error('Unpublish failed:', e)
    useToast().toast({
      title: 'Error',
      description: 'Failed to unpublish quote',
      toast: 'error'
    })
  }
}

// Selection helpers
const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }

const selectAllOnPage = () => {
  if (allSelectedOnPage.value) rowSelection.value = {}
  else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

const isAnyDialogOpen = computed(() =>
  showEditQuoteDialog.value || showBulkAddToCollection.value ||
  showBulkEditDialog.value || showBulkUnpublishModal.value
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

useAdminKeyboardShortcuts({
  selectAllOnPage,
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onEdit: () => { showBulkEditDialog.value = true },
  onDelete: () => { showBulkUnpublishModal.value = true },
  onConfirmDialog: () => {
    if (showBulkUnpublishModal.value) { bulkUnpublish(); showBulkUnpublishModal.value = false }
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  onSingleDelete: () => {
    if (highlightedQuote.value) unpublishQuote(highlightedQuote.value)
  }
})


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
      label: 'Add to Collection',
      leading: 'i-ph-bookmark',
      onclick: () => { showBulkAddToCollection.value = true }
    })
    actions.push({
      label: 'Unpublish Selected',
      leading: 'i-ph-eye-slash',
      shortcut: 'D',
      onclick: () => bulkUnpublish()
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

const handleBulkAddedToCollection = () => {
  showBulkAddToCollection.value = false
  clearSelection()
}

const bulkUnpublish = async () => {
  try {
    if (selectedQuotes.value.length === 0) return
    await $fetch('/api/admin/quotes/unpublish', {
      method: 'POST',
      body: { ids: selectedQuotes.value }
    })
    useToast().toast({
      title: 'Unpublished',
      description: `Unpublished ${selectedQuotes.value.length} quote(s)`,
      toast: 'success'
    })
    clearSelection()
    await loadQuotes()
  } catch (e) {
    console.error('Bulk unpublish failed:', e)
    useToast().toast({
      title: 'Error',
      description: 'Failed to unpublish selected quotes',
      toast: 'error'
    })
  }
}

watchDebounced([currentPage, searchQuery, selectedLanguage, selectedSort], () => {
  loadQuotes()
}, { debounce: 300, immediate: true })


</script>

<style scoped>
.quotes-table-container {
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
