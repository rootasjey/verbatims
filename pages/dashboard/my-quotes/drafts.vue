<template>
  <div class="min-h-screen">
    <!-- Mobile: Drafts List -->
    <div v-if="isMobile" class="mobile-drafts-page">
      <!-- Header & Controls -->
      <div class="p-4 pt-6">
        <div class="text-center mb-4">
          <h1 class="text-2xl font-600 text-gray-900 dark:text-white">Drafts</h1>
          <p class="text-gray-600 dark:text-gray-400">Your in-progress quotes</p>
        </div>

        <div class="flex gap-3">
          <UInput
            v-model="searchQuery"
            placeholder="Search your drafts..."
            leading="i-ph-magnifying-glass"
            size="md"
            class="flex-1"
          />
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Sort"
            size="sm"
            item-key="label"
            value-key="label"
            class="w-40"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && !hasLoadedOnce" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredQuotes.length === 0" class="text-center py-16 px-4">
        <UIcon name="i-ph-file-dashed" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching drafts' : 'No drafts yet' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Start writing your first quote draft.' }}
        </p>
      </div>

      <!-- Results -->
      <div v-else class="px-0 pb-6">
        <div class="px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'draft' : 'drafts' }}
        </div>

        <div class="divide-y divide-dashed divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          <QuoteListItem
            v-for="quote in processedMobileQuotes"
            :key="quote.id"
            :quote="quote"
          />
        </div>

        <div v-if="hasMore" class="px-4 pt-6">
          <UButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </UButton>
        </div>
      </div>
    </div>

    <!-- Desktop: Existing Table View -->
    <div v-else class="flex flex-col h-full">
      <!-- Fixed Header Section -->
      <div class="pb-6 mb-6 flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700">

        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <UInput
              v-model="searchQuery"
              placeholder="Search your drafts..."
              leading="i-ph-magnifying-glass"
              size="md"
              :loading="loading"
              :trailing="searchQuery ? 'i-ph-x' : undefined"
              :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
              @trailing="resetFilters"
            />
          </div>
          <div class="sm:w-48">
            <LanguageSelector :on-language-changed="onLanguageChanged" />
          </div>
          <div class="sm:w-48">
            <USelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Sort by"
              size="sm"
              item-key="label"
              value-key="label"
            />
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedQuotes.length > 0" class="flex-shrink-0 mb-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'draft' : 'drafts' }} selected
            </span>
            <div class="flex items-center gap-3">
              <UButton size="sm" btn="soft-blue" :loading="bulkProcessing" @click="bulkSubmit">
                <UIcon name="i-ph-paper-plane-tilt" />
                Submit Selected
              </UButton>
              <UButton size="sm" btn="soft-pink" :loading="bulkProcessing" @click="showBulkDeleteModal = true">
                <UIcon name="i-ph-trash" />
                Delete Selected
              </UButton>
              <UButton size="sm" btn="ghost" @click="clearSelection">
                Clear Selection
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrollable Content Area -->
      <div class="flex-1 overflow-hidden">
        <!-- First-load Skeleton State -->
        <TableFirstLoadSkeleton
          v-if="!hasLoadedOnce && loading"
          :rows="pageSize"
          :col-classes="[
            'w-12',
            'min-w-80 flex-1',
            'w-40',
            'w-24',
            'w-28',
            'w-16'
          ]"
          :layout="['checkbox','multi','text','pill','date','dot']"
          :show-footer="true"
        />

        <!-- Empty State -->
        <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="text-center py-16">
          <UIcon name="i-ph-file-dashed" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ searchQuery ? 'No matching drafts' : 'No drafts yet' }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ searchQuery ? 'Try adjusting your search terms.' : 'Start writing your first quote draft.' }}
          </p>
        </div>

        <!-- Quotes Table -->
        <div v-else class="flex-1 flex flex-col dark:bg-[#0C0A09]">
          <div class="quotes-table-container flex-1 overflow-auto">
            <UTable
              :columns="tableColumns"
              :data="filteredQuotes"
              :loading="loading"
              manual-pagination
              empty-text="No draft quotes found"
              empty-icon="i-ph-file-dashed"
            >

              <!-- Actions Header: toggle selection mode -->
              <template #actions-header>
                <div class="flex items-center justify-center gap-1">
                  <template v-if="selectionMode">
                    <UTooltip text="Select all on page">
                      <UButton
                        icon
                        btn="ghost"
                        size="2xs"
                        label="i-ph-checks"
                        :disabled="allSelectedOnPage"
                        @click="selectAllOnPage"
                      />
                    </UTooltip>
                  </template>
                  <UTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                    <UButton
                      icon
                      btn="ghost-gray"
                      size="2xs"
                      :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                      @click="toggleSelectionMode"
                    />
                  </UTooltip>
                </div>
              </template>

              <!-- Actions Column -->
              <template #actions-cell="{ cell }">
                <template v-if="!selectionMode">
                  <UDropdownMenu :items="getQuoteActions(cell.row.original)">
                    <UButton icon btn="ghost" size="xs" label="i-ph-dots-three-vertical" />
                  </UDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <UCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
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
                    <span v-if="cell.row.original.author?.name">{{ cell.row.original.author?.name }}</span>
                    <span v-if="cell.row.original.author?.name && cell.row.original.reference?.name">•</span>
                    <span v-if="cell.row.original.reference?.name">{{ cell.row.original.reference?.name }}</span>
                  </div>
                </div>
              </template>

              <!-- Author Column -->
              <template #author-cell="{ cell }">
                <div v-if="cell.row.original.author" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <UIcon name="i-ph-user" class="w-4 h-4 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ cell.row.original.author.name }}</span>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Reference Column -->
              <template #reference-cell="{ cell }">
                <div v-if="cell.row.original.reference" class="flex items-center text-sm text-gray-600 dark:text-gray-400 max-w-32">
                  <UIcon name="i-ph-book" class="w-4 h-4 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ cell.row.original.reference.name }}</span>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Tags Column -->
              <template #tags-cell="{ cell }">
                <div v-if="cell.row.original.tags?.length" class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="tag in cell.row.original.tags.slice(0, 2)"
                    :key="tag.id"
                    variant="subtle"
                    size="xs"
                  >
                    {{ tag.name }}
                  </UBadge>
                  <UBadge
                    v-if="cell.row.original.tags.length > 2"
                    variant="subtle"
                    size="xs"
                    color="gray"
                    :title="cell.row.original.tags.slice(2).map((tag: any) => tag.name).join(', ')"
                  >
                    +{{ cell.row.original.tags.length - 2 }}
                  </UBadge>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Status Column -->
              <template #status-cell>
                <UBadge color="gray" variant="subtle" size="xs">
                  Draft
                </UBadge>
              </template>

              <!-- Date Column -->
              <template #date-cell="{ cell }">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(cell.row.original.created_at) }}
                </span>
              </template>
            </UTable>
          </div>
          <!-- Pagination -->
          <div class="flex-shrink-0 flex items-center justify-between pt-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <span>Page {{ currentPage }} of {{ totalPages }}</span>
            </div>

            <UPagination
              v-model:page="currentPage"
              :total="totalDrafts"
              :items-per-page="pageSize"
              :sibling-count="2"
              show-edges
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <UDialog v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete Draft</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this draft? This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deleting" @click="deleteDraft">
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <!-- Bulk Delete Confirmation -->
    <UDialog v-model="showBulkDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'Draft' : 'Drafts' }}</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          You are about to delete {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'draft' : 'drafts' }}. This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton btn="ghost" @click="showBulkDeleteModal = false">Cancel</UButton>
            <UButton color="red" :loading="bulkProcessing" @click="bulkDelete">Delete All</UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <AddQuoteDialog
      v-model="showEditQuoteDialog"
      :edit-quote="selectedQuote"
      @quote-updated="onQuoteUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~/types'
import type { QuoteWithRelations } from '~/types/quote'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Drafts - Dashboard - Verbatims'
})

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

const languageStore = useLanguageStore()

const loading = ref(true)
const loadingMore = ref(false)
const hasLoadedOnce = ref(false)
const bulkProcessing = ref(false)
const deleting = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalDrafts = ref(0)
const totalPages = ref(0)
const hasMore = ref(false)
// Custom selection mode (we avoid built-in enableRowSelection due to mount issues)
const selectionMode = ref(false)

const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showEditQuoteDialog = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)
// Local row selection state (keyed by row id)
const rowSelection = ref<Record<string, boolean>>({})
// Derive selected quote ids from rowSelection
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

// Visible ids based on current filteredQuotes page
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Author A-Z', value: 'author' }
]

// Backend search - keep only local sorting
const filteredQuotes = computed(() => {
  const list = [...quotes.value]
  switch (sortBy.value.value) {
    case 'oldest':
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'author':
      list.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default:
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return list
})

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return filteredQuotes.value.map((q) => ({
    ...q,
    result_type: 'quote',
    author_name: (q as any).author_name ?? q.author?.name,
    author_is_fictional: (q as any).author_is_fictional ?? (q.author as any)?.is_fictional,
    author_image_url: (q as any).author_image_url ?? (q.author as any)?.image_url,
    reference_name: (q as any).reference_name ?? q.reference?.name,
    reference_type: (q as any).reference_type ?? (q.reference as any)?.type,
    tags: (q as any).tags ?? [],
    author: q.author || ((q as any).author_name ? { id: q.author_id!, name: (q as any).author_name, is_fictional: (q as any).author_is_fictional, image_url: (q as any).author_image_url } as any : undefined),
    reference: q.reference || ((q as any).reference_name ? { id: q.reference_id!, name: (q as any).reference_name, type: (q as any).reference_type } as any : undefined),
  }))
})

const tableColumns = [
  {
    header: '',
    accessorKey: 'actions',
    enableSorting: false,
    meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } }
  },
  {
    header: 'Quote',
    accessorKey: 'quote',
    enableSorting: false,
    meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } }
  },
  {
    header: 'Author',
    accessorKey: 'author',
    enableSorting: false,
    meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } }
  },
  {
    header: 'Reference',
    accessorKey: 'reference',
    enableSorting: false,
    meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } }
  },
  {
    header: 'Tags',
    accessorKey: 'tags',
    enableSorting: false,
    meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } }
  },
  {
    header: 'Status',
    accessorKey: 'status',
    enableSorting: false,
    meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } }
  },
  {
    header: 'Created',
    accessorKey: 'date',
    enableSorting: false,
    meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } }
  }
]

const loadDrafts = async (page = 1) => {
  try {
    if (page === 1) loading.value = true
    if (page > 1) loadingMore.value = true
    const queryParams: any = { page, limit: pageSize.value, status: 'draft' }

    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }

    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }

    const response = await $fetch('/api/dashboard/submissions', { query: queryParams })

    const data = (response as any)?.data || []
    // On mobile, append when loading subsequent pages; on desktop, replace
    if (isMobile.value && page > 1) {
      quotes.value.push(...data)
    } else {
      quotes.value = data
      // Reset selection when replacing
      rowSelection.value = {}
    }

    totalDrafts.value = response.pagination?.total || 0
    pageSize.value = response.pagination?.limit || pageSize.value
    totalPages.value = response.pagination?.totalPages || Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || pageSize.value))
    currentPage.value = page
    hasMore.value = (response as any)?.pagination?.hasMore ?? (currentPage.value < totalPages.value)
  } catch (error) {
    console.error('Failed to load drafts:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    hasLoadedOnce.value = true
  }
}

watch(currentPage, () => {
  // Desktop paginated table only
  if (!isMobile.value) {
    loadDrafts(currentPage.value)
  }
})

watchDebounced([searchQuery, sortBy], () => {
  currentPage.value = 1
  loadDrafts(1)
}, { debounce: 300 })

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {}, // Divider
  {
    label: 'Submit for Review',
    leading: 'i-ph-paper-plane-tilt',
    onclick: () => submitQuote(quote)
  },
  {}, // Divider
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(quote)
  }
]

const editQuote = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = null
  // Refresh the quotes list to show updated data
  loadDrafts()
}

const submitQuote = async (quote: DashboardQuote) => {
  const { toast } = useToast()

  try {
    await $fetch(`/api/quotes/${quote.id}/submit`, {
      method: 'POST'
    })

    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (error: any) {
    console.error('Failed to submit quote:', error)
    toast({
    toast: 'error',
      title: 'Failed to submit quote',
      description: error?.data?.message || 'Please try again.'
    })
  }
}

const confirmDelete = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showDeleteModal.value = true
}

const deleteDraft = async () => {
  if (!selectedQuote.value) return

  deleting.value = true
  try {
    await $fetch(`/api/quotes/${selectedQuote.value.id}`, {
      method: 'DELETE'
    } as any)

    // Remove from list
    quotes.value = quotes.value.filter(q => q.id !== selectedQuote.value?.id)
    showDeleteModal.value = false
    selectedQuote.value = null
  } catch (error) {
    console.error('Failed to delete draft:', error)
  } finally {
    deleting.value = false
  }
}

const clearSelection = () => {
  rowSelection.value = {}
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    // When deactivating, clear any selection
    clearSelection()
  }
}

const setRowSelected = (id: number, value: boolean | 'indeterminate') => {
  // Treat 'indeterminate' as false for this simple selection model
  rowSelection.value[id] = value === true
}

const selectAllOnPage = () => {
  visibleIds.value.forEach(id => {
    rowSelection.value[id] = true
  })
}

// Keyboard shortcut: Cmd/Ctrl + A to select all (only when selection mode is active)
const onKeydown = (e: KeyboardEvent) => {
  if (!selectionMode.value) return
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const metaPressed = isMac ? e.metaKey : e.ctrlKey
  if (metaPressed && (e.key === 'a' || e.key === 'A')) {
    e.preventDefault()
    selectAllOnPage()
  }
}

const bulkSubmit = async () => {
  if (selectedQuotes.value.length === 0) return
  const { toast } = useToast()
  try {
    bulkProcessing.value = true
    // Process in parallel with small batches
    const ids = [...selectedQuotes.value]
    const batchSize = 5
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await Promise.all(batch.map(id => $fetch(`/api/quotes/${id}/submit`, { method: 'POST' } as any)))
    }
    // Remove submitted from list
    quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
    rowSelection.value = {}
    toast({ title: 'Submitted', description: 'Selected drafts submitted for review.' })
  } catch (error) {
    console.error('Failed to bulk submit:', error)
    toast({ title: 'Bulk submit failed', description: 'Please try again.' })
  } finally {
    bulkProcessing.value = false
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
    toast({ title: 'Bulk delete failed', description: 'Please try again.' })
  } finally {
    bulkProcessing.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value.value = 'recent'
  currentPage.value = 1
  loadDrafts(1)
}

const onLanguageChanged = async () => {
  // Reset to first page when language changes and reload
  await loadDrafts(1)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadDrafts()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  await loadDrafts(currentPage.value + 1)
}
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 22rem);
}

.mobile-drafts-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
}

</style>
