<template>
  <div class="flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="-mt-6 pb-6 mb-6 flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Pending Review
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Your quotes awaiting moderation approval.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search pending quotes..."
            leading="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
            :trailing="searchQuery ? 'i-ph-x' : undefined"
            :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
            @trailing="resetFilters"
          />
        </div>
        <div class="w-full sm:w-48">
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
            {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }} selected
          </span>
          <div class="flex items-center gap-3">
            <UButton size="sm" btn="soft-orange" :loading="bulkProcessing" @click="bulkWithdraw">
              <UIcon name="i-ph-arrow-counter-clockwise" />
              Withdraw Selected
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
        <UIcon name="i-ph-clock" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching pending quotes' : 'No pending quotes' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes to see them here while they await review.' }}
        </p>
        <UButton v-if="!searchQuery" btn="solid-black" to="/dashboard/my-quotes/drafts">
          <UIcon name="i-ph-file-dashed" />
          <span>View Drafts</span>
        </UButton>
      </div>

      <!-- Quotes Table -->
      <div v-else class="flex-1 flex flex-col dark:bg-[#0C0A09]">
        <div class="quotes-table-container flex-1 overflow-auto">
          <UTable
            :columns="tableColumns"
            :data="filteredQuotes"
            :loading="loading"
            manual-pagination
            empty-text="No pending quotes found"
            empty-icon="i-ph-clock"
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
                    btn="ghost"
                    size="2xs"
                    :label="selectionMode ? 'i-ph-x' : 'i-ph-check-square'"
                    @click="toggleSelectionMode"
                  />
                </UTooltip>
              </div>
            </template>

            <!-- Actions Column -->
            <template #actions-cell="{ cell }">
              <template v-if="!selectionMode">
                <UDropdownMenu :items="getQuoteActions(cell.row.original)">
                  <UButton
                    icon
                    btn="ghost"
                    size="xs"
                    label="i-ph-dots-three-vertical"
                    :loading="withdrawingId === cell.row.original.id"
                    :disabled="withdrawingId === cell.row.original.id"
                  />
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
              <div v-if="cell.row.original.reference" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
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
              <UBadge color="orange" variant="subtle" size="xs">
                Pending
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
            :total="totalQuotes"
            :items-per-page="pageSize"
            :sibling-count="2"
            show-edges
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- Quote details dialog -->
    <AdminQuoteDetailDialog
      :quote="selectedDialogQuote"
      v-model:open="showQuoteDialog"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuoteWithRelations, AdminQuote } from '~/types/quote'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Pending Review - Dashboard - Verbatims'
})
const languageStore = useLanguageStore()

const loading = ref(true)
const hasLoadedOnce = ref(false)
const bulkProcessing = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
const totalPages = ref(0)
// Custom selection mode
const selectionMode = ref(false)

const showQuoteDialog = ref(false)
const selectedDialogQuote = ref<AdminQuote | null>(null)
// Track a single in-progress withdraw (optional)
const withdrawingId = ref<number | null>(null)
// Local row selection state
const rowSelection = ref<Record<string, boolean>>({})
// Derive selected quote ids
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Author A-Z', value: 'author' }
]
// Visible ids based on current filteredQuotes page
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

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

const tableColumns = [
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: 'Quote', accessorKey: 'quote', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Author', accessorKey: 'author', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Reference', accessorKey: 'reference', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Tags', accessorKey: 'tags', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Submitted', accessorKey: 'date', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } }
]

const loadPendingQuotes = async (page = 1) => {
  try {
    loading.value = true
    const queryParams: any = { page, limit: pageSize.value, status: 'pending' }
    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }
    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }
    const response = await $fetch('/api/dashboard/submissions', { query: queryParams })
    quotes.value = response.data || []
    rowSelection.value = {}
    totalQuotes.value = response.pagination?.total || 0
    pageSize.value = response.pagination?.limit || pageSize.value
    totalPages.value = response.pagination?.totalPages || Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || pageSize.value))
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load pending quotes:', error)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'View Details',
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  },
  {}, // Divider
  {
    label: 'Withdraw',
    leading: 'i-ph-arrow-counter-clockwise',
    disabled: withdrawingId.value === quote.id,
    onclick: () => withdrawQuote(quote)
  }
]

const viewQuote = (quote: DashboardQuote) => {
  selectedDialogQuote.value = quote as unknown as AdminQuote
  showQuoteDialog.value = true
}

const withdrawQuote = async (quote: DashboardQuote) => {
  const { toast } = useToast()
  try {
    withdrawingId.value = quote.id
    await $fetch(`/api/quotes/${quote.id}/withdraw`, { method: 'POST' } as any)
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (error) {
    console.error('Failed to withdraw quote:', error)
    toast({ title: 'Withdraw failed', description: 'Please try again.' })
  } finally {
    withdrawingId.value = null
  }
}

const clearSelection = () => {
  rowSelection.value = {}
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) clearSelection()
}

const setRowSelected = (id: number, value: boolean | 'indeterminate') => {
  rowSelection.value[id] = value === true
}

const selectAllOnPage = () => {
  visibleIds.value.forEach(id => (rowSelection.value[id] = true))
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

const bulkWithdraw = async () => {
  if (selectedQuotes.value.length === 0) return
  const { toast } = useToast()
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    await $fetch('/api/quotes/withdraw', {
      method: 'POST',
      body: { ids }
    })

    quotes.value = quotes.value.filter(q => !ids.includes(q.id))
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk withdraw:', error)
    const { toast } = useToast()
    toast({ title: 'Bulk withdraw failed', description: 'Please try again.' })
  } finally {
    bulkProcessing.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value.value = 'recent'
  currentPage.value = 1
  loadPendingQuotes(1)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Watch for page changes to load new data
watch(currentPage, () => {
  loadPendingQuotes(currentPage.value)
})

// Debounced server-side search and sort-triggered reload
watchDebounced([searchQuery, sortBy], () => {
  currentPage.value = 1
  loadPendingQuotes(1)
}, { debounce: 300 })

onMounted(() => {
  loadPendingQuotes()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 22rem);
  max-width: calc(100vw - 20rem);
}
</style>
