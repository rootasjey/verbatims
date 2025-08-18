<template>
  <div class="flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search your published quotes..."
            leading="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
            :trailing="searchQuery ? 'i-ph-x' : undefined"
            :una="{
              inputTrailing: 'pointer-events-auto cursor-pointer',
            }"
            @trailing="resetFilters"
          />
        </div>
        <div class="w-full sm:w-48">
          <LanguageSelector :on-language-changed="onLanguageChanged" />
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
            <UButton size="sm" btn="soft-blue" @click="showBulkAddToCollection = true">
              <UIcon name="i-ph-bookmark" />
              Add to Collection
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
          'w-40',
          'w-32',
          'w-32',
          'w-24',
          'w-28'
        ]"
        :layout="['checkbox','multi','text','text','pill','pill','date','dot']"
        :show-footer="true"
      />

      <!-- Empty State -->
      <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="text-center py-16">
        <UIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching published quotes' : 'No published quotes yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes and get them approved to see them here.' }}
        </p>
        <UButton v-if="!searchQuery" to="/dashboard/my-quotes/drafts">
          <UIcon name="i-ph-plus" />
          <span>Create New Quote</span>
        </UButton>
      </div>

      <!-- Quotes Table Container -->
      <div v-else class="flex flex-col h-full">
        <!-- Results Count -->
        <div class="flex-shrink-0 flex items-center justify-between mb-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Showing {{ displayedCount }} of {{ totalQuotes }} {{ totalQuotes === 1 ? 'quote' : 'quotes' }}
            <span v-if="searchQuery || sortBy.value !== 'recent'" class="text-gray-400">
              (page {{ currentPage }} of {{ totalPages }})
            </span>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Total views: {{ totalViews.toLocaleString() }} • Total likes: {{ totalLikes.toLocaleString() }}
          </div>
        </div>

        <!-- Scrollable Table Container -->
        <div class="quotes-table-container flex-1 overflow-auto max-w-screen">
          <UTable
            :columns="tableColumns"
            :data="filteredQuotes"
            :loading="loading"
            manual-paginationxz
            empty-text="No published quotes found"
            empty-icon="i-ph-check-circle"
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
                <UButton
                  icon
                  btn="ghost"
                  size="sm"
                  label="i-ph-dots-three-vertical"
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
                class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-normal break-words"
                :title="cell.row.original.name"
              >
                {{ cell.row.original.name }}
              </blockquote>
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
            <div v-if="cell.row.original.reference" class="flex gap-2 text-sm text-gray-600 dark:text-gray-400 max-w-32">
              <UIcon name="i-ph-book" class="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span class="">{{ cell.row.original.reference.name }}</span>
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

          <!-- Stats Column -->
          <template #stats-cell="{ cell }">
            <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center" :title="`${cell.row.original.likes_count || 0} likes`">
                <UIcon name="i-ph-heart" class="w-3 h-3 mr-1" />
                {{ cell.row.original.likes_count || 0 }}
              </span>
              <span class="flex items-center" :title="`${cell.row.original.views_count || 0} views`">
                <UIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
                {{ cell.row.original.views_count || 0 }}
              </span>
              <span class="flex items-center" :title="`${cell.row.original.shares_count || 0} shares`">
                <UIcon name="i-ph-share" class="w-3 h-3 mr-1" />
                {{ cell.row.original.shares_count || 0 }}
              </span>
            </div>
          </template>

          <!-- Published Date Column -->
          <template #published-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(cell.row.original.approved_at || cell.row.original.created_at) }}
            </span>
          </template>
        </UTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 flex items-center justify-between pt-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Page {{ currentPage }} of {{ totalPages }}
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

    <!-- Add to Collection Modal -->
    <AddToCollectionModal
      v-if="selectedQuote"
      v-model="showAddToCollectionModal"
      :quote="selectedQuote"
      @added="handleAddedToCollection"
    />

    <!-- Bulk Add to Collection Modal -->
    <AddToCollectionBulkModal
      v-if="selectedQuotes.length > 0"
      v-model="showBulkAddToCollection"
      :quote-ids="selectedQuotes"
      @added="handleBulkAddedToCollection"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'

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
  title: 'Published Quotes - Dashboard - Verbatims'
})

const languageStore = useLanguageStore()

const loading = ref(true)
const hasLoadedOnce = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0) // Total number of quotes from API
const totalPages = ref(0) // Total pages from API

const selectionMode = ref(false)
const rowSelection = ref<Record<string, boolean>>({})
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const showAddToCollectionModal = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)
const showBulkAddToCollection = ref(false)

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Author A-Z', value: 'author' }
]

const tableColumns = [
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
    header: 'Author',
    accessorKey: 'author',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-40',
        tableCell: 'w-40'
      }
    }
  },
  {
    header: 'Reference',
    accessorKey: 'reference',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-40',
        tableCell: 'w-40'
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
    header: 'Stats',
    accessorKey: 'stats',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
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
  }
]

const totalViews = computed(() => {
  return quotes.value.reduce((sum, quote) => sum + (quote.views_count || 0), 0)
})

const totalLikes = computed(() => {
  return quotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
})

// Backend search - no client-side filtering needed
const filteredQuotes = computed(() => quotes.value)
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const displayedCount = computed(() => quotes.value.length)

watch(currentPage, () => {
  loadPublishedQuotes()
})

watchDebounced([searchQuery, sortBy], () => {
  currentPage.value = 1
  loadPublishedQuotes()
}, { debounce: 300 })

const loadPublishedQuotes = async () => {
  try {
    loading.value = true

    // Build query parameters with language filtering and search
    const queryParams: any = {
      page: currentPage.value,
      limit: pageSize.value,
      status: 'approved'
    }

    // Add language filter if not "all"
    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }

    // Add search parameter if provided
    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }

    const response = await $fetch('/api/dashboard/submissions', {
      query: queryParams
    })

    quotes.value = response.data || []
    totalQuotes.value = response.pagination.total
    totalPages.value = response.pagination.totalPages || Math.ceil(response.pagination.total / response.pagination.limit)
    pageSize.value = response.pagination.limit
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to load published quotes:', error)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value = { label: 'Most Recent', value: 'recent' }
  currentPage.value = 1
  loadPublishedQuotes()
}

const onLanguageChanged = async () => {
  currentPage.value = 1
  await loadPublishedQuotes()
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  }, {
    label: 'Add to Collection',
    leading: 'i-ph-bookmark',
    onclick: () => addToCollection(quote)
  },
  {}, // Divider
  {
    label: 'Share',
    leading: 'i-ph-share',
    onclick: () => shareQuote(quote)
  }
]

const viewQuote = (quote: DashboardQuote) => {
  navigateTo(`/quote/${quote.id}`)
}

const addToCollection = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showAddToCollectionModal.value = true
}

const shareQuote = (quote: DashboardQuote) => {
  const url = `${window.location.origin}/quote/${quote.id}`
  navigator.clipboard.writeText(url)
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

const handleBulkAddedToCollection = () => {
  showBulkAddToCollection.value = false
  clearSelection()
}

const handleAddedToCollection = () => {
  showAddToCollectionModal.value = false
  selectedQuote.value = null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadPublishedQuotes()
  window.addEventListener('keydown', onKeydown)
})

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

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 22rem);
}
</style>