<template>
  <div class="frame flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Published Quotes
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Your approved and published quotes.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search your published quotes..."
            icon="i-ph-magnifying-glass"
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

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQuotes.length === 0 && !loading" class="text-center py-16">
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
        <div class="quotes-table-container flex-1 overflow-auto">
          <UTable
            :columns="tableColumns"
            :data="filteredQuotes"
            :loading="loading"
            empty-text="No published quotes found"
            empty-icon="i-ph-check-circle"
          >
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

          <!-- Status Column -->
          <template #status-cell>
            <UBadge color="green" variant="subtle" size="xs">
              Published
            </UBadge>
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
  </div>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

// Use dashboard layout
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Published Quotes - Dashboard - Verbatims'
})

const languageStore = useLanguageStore()

const loading = ref(true)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0) // Total number of quotes from API
const totalPages = ref(0) // Total pages from API

// Modals
const showAddToCollectionModal = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)

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

const displayedCount = computed(() => quotes.value.length)

// Watch for page changes to load new data
watch(currentPage, () => {
  loadPublishedQuotes()
})

// Watch for search and sort changes with debounced API calls
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
  } catch (error) {
    console.error('Failed to load published quotes:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value = { label: 'Most Recent', value: 'recent' }
  currentPage.value = 1
}

// Handle language change from LanguageSelector
const onLanguageChanged = async () => {
  // Reset to first page when language changes
  currentPage.value = 1
  // Reload quotes with new language filter
  await loadPublishedQuotes()
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    click: () => viewQuote(quote)
  }, {
    label: 'Add to Collection',
    leading: 'i-ph-bookmark',
    click: () => addToCollection(quote)
  },
  {}, // Divider
  {
    label: 'Share',
    leading: 'i-ph-share',
    click: () => shareQuote(quote)
  }
]

const viewQuote = (quote: DashboardQuote) => {
  navigateTo(`/quotes/${quote.id}`)
}

const addToCollection = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showAddToCollectionModal.value = true
}

const shareQuote = (quote: DashboardQuote) => {
  // Copy quote URL to clipboard
  const url = `${window.location.origin}/quotes/${quote.id}`
  navigator.clipboard.writeText(url)
  // Could show a toast notification here
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
})
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 20rem);
  max-width: calc(100vw - 20rem);
}
</style>