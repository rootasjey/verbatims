<template>
  <div class="min-h-screen">
    <!-- Mobile: Published List -->
    <div v-if="isMobile" class="mobile-published-page bg-gray-50 dark:bg-[#0A0805] min-h-screen pb-24">
      <!-- Header -->
      <div 
        class="sticky top-10 z-10 bg-white dark:bg-[#0F0D0B] border-b rounded-6 border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out"
        :class="{ 'shadow-sm': !showHeaderElements }"
      >
        <div class="px-4 transition-all duration-300 ease-in-out" :class="showHeaderElements ? 'py-5' : 'py-3'">
          <div class="mt-4 transition-all duration-300 ease-in-out" :class="{ 'mb-4': showHeaderElements }">
            <h1 
              class="overflow-hidden font-sans text-gray-900 dark:text-white transition-all duration-300 ease-in-out"
              :class="showHeaderElements ? 'text-4xl font-600' : 'text-2xl font-600'"
            >
              Published
            </h1>
          </div>

          <!-- Search Bar with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'mb-3 max-h-20 opacity-100' : 'max-h-0 opacity-0 mb-0'"
          >
            <NInput
              v-model="searchQuery"
              :placeholder="`Search among ${filteredQuotes.length} published ${filteredQuotes.length === 1 ? 'quote' : 'quotes'}...`"
              leading="i-ph-magnifying-glass"
              size="lg"
              class="w-full"
              rounded="4"
              :trailing="searchQuery ? 'i-ph-x' : undefined"
              :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
              @trailing="searchQuery = ''"
            />
          </div>

          <!-- Filter Chips with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
              <NBadge
                :badge="sortBy.value === 'recent' ? 'solid-blue' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Most Recent', value: 'recent' }"
              >
                <NIcon name="i-ph-clock" class="w-3 h-3 mr-1.5" />
                Recent
              </NBadge>
              <NBadge
                :badge="sortBy.value === 'oldest' ? 'soft-pink' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Oldest First', value: 'oldest' }"
              >
                <NIcon name="i-ph-calendar-blank" class="w-3 h-3 mr-1.5" />
                Oldest
              </NBadge>
              <NBadge
                :badge="sortBy.value === 'popular' ? 'soft-blue' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Most Popular', value: 'popular' }"
              >
                <NIcon name="i-ph-heart" class="w-3 h-3 mr-1.5" />
                Popular
              </NBadge>
              <NBadge
                :badge="sortBy.value === 'views' ? 'soft-blue' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Most Viewed', value: 'views' }"
              >
                <NIcon name="i-ph-eye" class="w-3 h-3 mr-1.5" />
                Views
              </NBadge>
              <NBadge
                :badge="sortBy.value === 'author' ? 'soft-blue' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Author A-Z', value: 'author' }"
              >
                <NIcon name="i-ph-user" class="w-3 h-3 mr-1.5" />
                Author
              </NBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredQuotes.length === 0" class="text-center py-16 px-4">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching published quotes' : 'No published quotes yet' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes and get them approved to see them here.' }}
        </p>
        <NButton v-if="!searchQuery" btn="solid-black" to="/dashboard/my-quotes/drafts">
          <NIcon name="i-ph-plus" />
          Create New Quote
        </NButton>
      </div>

      <!-- Results -->
      <div v-else class="px-3 pt-3 pb-6 space-y-3">
        <div class="px-1 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'quote' : 'quotes' }}
        </div>

        <div class="space-y-3">
          <QuoteListItem
            v-for="quote in processedMobileQuotes"
            :key="quote.id"
            :quote="quote"
            :actions="publishedQuoteActions"
            @share="shareQuote"
            @add-to-collection="addToCollection"
          />
        </div>

        <div v-if="hasMore" class="px-4 pt-6">
          <NButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </NButton>
        </div>
      </div>

      <AddToCollectionDrawer
        v-if="selectedQuote && isMobile"
        :open="showAddToCollectionDrawer"
        :quote="selectedQuote"
        @update:open="val => (showAddToCollectionDrawer = val)"
        @added="handleAddedToCollection"
      />
    </div>

    <!-- Desktop: existing table UI -->
    <div v-else class="flex flex-col h-full">
      <!-- Fixed Header Section -->
      <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <NInput
              v-model="searchQuery"
              placeholder="Search your published quotes..."
              leading="i-ph-magnifying-glass"
              size="md"
              :loading="loading"
              :trailing="searchQuery ? 'i-ph-x' : undefined"
              :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
              @trailing="resetFilters"
            />
          </div>
          <div class="w-full sm:w-48">
            <LanguageSelector :on-language-changed="onLanguageChanged" />
          </div>
          <div class="w-full sm:w-48">
            <NSelect
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
              <NButton size="sm" btn="soft-blue" @click="showBulkAddToCollection = true">
                <NIcon name="i-ph-bookmark" />
                Add to Collection
              </NButton>
              <NButton size="sm" btn="ghost" @click="clearSelection">
                Clear Selection
              </NButton>
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
          <NIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ searchQuery ? 'No matching published quotes' : 'No published quotes yet' }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes and get them approved to see them here.' }}
          </p>
          <NButton v-if="!searchQuery" to="/dashboard/my-quotes/drafts">
            <NIcon name="i-ph-plus" />
            <span>Create New Quote</span>
          </NButton>
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
            <NTable
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
            <!-- Actions Column -->
            <template #actions-cell="{ cell }">
              <template v-if="!selectionMode">
                <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                  <NButton
                    icon
                    btn="ghost"
                    size="sm"
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
                <NIcon name="i-ph-user" class="w-4 h-4 mr-1 flex-shrink-0" />
                <span class="truncate">{{ cell.row.original.author.name }}</span>
              </div>
              <span v-else class="text-sm text-gray-400">—</span>
            </template>

            <!-- Reference Column -->
            <template #reference-cell="{ cell }">
              <div v-if="cell.row.original.reference" class="flex gap-2 text-sm text-gray-600 dark:text-gray-400 max-w-32">
                <NIcon name="i-ph-book" class="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span class="">{{ cell.row.original.reference.name }}</span>
              </div>
              <span v-else class="text-sm text-gray-400">—</span>
            </template>

            <!-- Tags Column -->
            <template #tags-cell="{ cell }">
              <div v-if="cell.row.original.tags?.length" class="flex flex-wrap gap-1">
                <NBadge
                  v-for="tag in cell.row.original.tags.slice(0, 2)"
                  :key="tag.id"
                  variant="subtle"
                  size="xs"
                >
                  {{ tag.name }}
                </NBadge>
                <NBadge
                  v-if="cell.row.original.tags.length > 2"
                  variant="subtle"
                  size="xs"
                  color="gray"
                  :title="cell.row.original.tags.slice(2).map((tag: any) => tag.name).join(', ')"
                >
                  +{{ cell.row.original.tags.length - 2 }}
                </NBadge>
              </div>
              <span v-else class="text-sm text-gray-400">—</span>
            </template>

            <!-- Stats Column -->
            <template #stats-cell="{ cell }">
              <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center" :title="`${cell.row.original.likes_count || 0} likes`">
                  <NIcon name="i-ph-heart" class="w-3 h-3 mr-1" />
                  {{ cell.row.original.likes_count || 0 }}
                </span>
                <span class="flex items-center" :title="`${cell.row.original.views_count || 0} views`">
                  <NIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
                  {{ cell.row.original.views_count || 0 }}
                </span>
                <span class="flex items-center" :title="`${cell.row.original.shares_count || 0} shares`">
                  <NIcon name="i-ph-share" class="w-3 h-3 mr-1" />
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
          </NTable>
          </div>

          <!-- Pagination -->
          <div class="flex-shrink-0 flex items-center justify-between pt-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Page {{ currentPage }} of {{ totalPages }}
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

      <AddToCollectionModal
        v-if="selectedQuote && !isMobile"
        v-model="showAddToCollectionModal"
        :quote="selectedQuote"
        @added="handleAddedToCollection"
      />

      <AddToCollectionBulkModal
        v-if="selectedQuotes.length > 0"
        v-model="showBulkAddToCollection"
        :quote-ids="selectedQuotes"
        @added="handleBulkAddedToCollection"
      />
    </div>
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
  title: 'Published Quotes - Dashboard - Verbatims'
})

const languageStore = useLanguageStore()
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

const loading = ref(true)
const hasLoadedOnce = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0) // Total number of quotes from API
const totalPages = ref(0) // Total pages from API

// Mobile-specific pagination
const hasMore = ref(false)
const loadingMore = ref(false)

// Scroll header state (mobile)
const scrollY = ref(0)
const lastScrollY = ref(0)
const isScrollingDown = ref(false)
const showHeaderElements = ref(true)

const handleScroll = () => {
  if (!isMobile.value) return
  scrollY.value = window.scrollY
  const scrollThreshold = 50
  if (scrollY.value > lastScrollY.value && scrollY.value > scrollThreshold) {
    isScrollingDown.value = true
    showHeaderElements.value = false
  } else if (scrollY.value < lastScrollY.value || scrollY.value <= scrollThreshold) {
    isScrollingDown.value = false
    showHeaderElements.value = true
  }
  lastScrollY.value = scrollY.value
}

const selectionMode = ref(false)
const rowSelection = ref<Record<string, boolean>>({})
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const showAddToCollectionDrawer = ref(false)
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

const publishedQuoteActions = [
  {
    label: 'Share',
    leading: 'i-ph-share'
  },
  { divider: true } as any,
  {
    label: 'Add to Collection',
    leading: 'i-ph-folder-plus'
  }
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

// For desktop we rely on backend search; for mobile we apply lightweight client filtering/sorting
const filteredQuotes = computed(() => {
  if (!isMobile.value) return quotes.value

  let filtered = [...quotes.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.author?.name?.toLowerCase().includes(q) ||
      item.reference?.name?.toLowerCase().includes(q)
    )
  }

  switch (sortBy.value.value) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.approved_at || a.created_at).getTime() - new Date(b.approved_at || b.created_at).getTime())
      break
    case 'popular':
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      break
    case 'views':
      filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      break
    case 'author':
      filtered.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default: // recent
      filtered.sort((a, b) => new Date(b.approved_at || b.created_at).getTime() - new Date(a.approved_at || a.created_at).getTime())
  }

  return filtered
})

// Shape for mobile list item component
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
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const displayedCount = computed(() => quotes.value.length)

watch(currentPage, () => {
  if (!isMobile.value) loadPublishedQuotes()
})

watchDebounced([searchQuery, sortBy], () => {
  if (isMobile.value) return
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

// Mobile loader (append mode)
const loadPublishedMobile = async (page = 1) => {
  try {
    loading.value = page === 1
    loadingMore.value = page > 1

    const queryParams: any = {
      page,
      limit: 20,
      status: 'approved'
    }

    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }

    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }

    const response = await $fetch('/api/dashboard/submissions', { query: queryParams })

    const data = (response as any)?.data || []
    if (page === 1) {
      quotes.value = data
    } else {
      quotes.value.push(...data)
    }

    totalQuotes.value = response.pagination.total
    totalPages.value = response.pagination.totalPages || Math.ceil(response.pagination.total / response.pagination.limit)
    hasMore.value = page < totalPages.value
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load published quotes (mobile):', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    hasLoadedOnce.value = true
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  await loadPublishedMobile(currentPage.value + 1)
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value = { label: 'Most Recent', value: 'recent' }
  currentPage.value = 1
  loadPublishedQuotes()
}

const onLanguageChanged = async () => {
  currentPage.value = 1
  if (isMobile.value) await loadPublishedMobile(1)
  else await loadPublishedQuotes()
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
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

const addToCollection = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  if (isMobile.value) showAddToCollectionDrawer.value = true
  else showAddToCollectionModal.value = true
}

const shareQuote = (quote: DashboardQuote) => {
  const url = `${window.location.origin}/quotes/${quote.id}`
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
  showAddToCollectionDrawer.value = false
  showAddToCollectionModal.value = false
  selectedQuote.value = null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  if (isMobile.value) loadPublishedMobile(1)
  else loadPublishedQuotes()
  window.addEventListener('keydown', onKeydown)
  // Add mobile scroll listener
  if (isMobile.value) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
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
  if (isMobile.value) {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 22rem);
}

.mobile-published-page {
  min-height: calc(100vh - 80px);
}
</style>