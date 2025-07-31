<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Published Quotes
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Your approved and published quotes.
      </p>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="Search your published quotes..."
          icon="i-ph-magnifying-glass"
          size="md"
        />
      </div>
      <div class="w-full sm:w-48">
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          placeholder="Sort by"
          size="sm"
          item-key="label"
          value-key="value"
        />
      </div>
    </div>

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
      <UButton v-if="!searchQuery" to="/dashboard/my-quotes/drafts" icon label="i-ph-plus">
        Create New Quote
      </UButton>
    </div>

    <!-- Quotes Table -->
    <div v-else class="space-y-6">
      <!-- Results Count -->
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'quote' : 'quotes' }} published
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Total views: {{ totalViews.toLocaleString() }} • Total likes: {{ totalLikes.toLocaleString() }}
        </div>
      </div>

      <!-- Table -->
      <UTable
        :columns="tableColumns"
        :data="filteredQuotes"
        :loading="loading"
        empty-text="No published quotes found"
        empty-icon="i-ph-check-circle"
        class="border border-dashed border-gray-200 dark:border-gray-700"
      >
        <!-- Actions Column -->
        <template #actions-cell="{ cell }">
          <UDropdownMenu :items="getQuoteActions(cell.row.original)">
            <UButton
              icon
              variant="ghost"
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
              "{{ cell.row.original.name }}"
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

      <!-- Load More -->
      <div v-if="hasMore" class="text-center pt-8">
        <UButton
          :loading="loadingMore"
          variant="outline"
          size="lg"
          @click="loadMore"
        >
          Load More
        </UButton>
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

// SEO
useHead({
  title: 'Published Quotes - Dashboard - Verbatims'
})

// Data
const loading = ref(true)
const loadingMore = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref('recent')
const hasMore = ref(false)
const currentPage = ref(1)

// Modals
const showAddToCollectionModal = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)

// Sort options
const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Author A-Z', value: 'author' }
]

// Table columns
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

// Computed
const filteredQuotes = computed(() => {
  let filtered = [...quotes.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote => 
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query) ||
      quote.tags?.some(tag => tag.name.toLowerCase().includes(query))
    )
  }
  
  // Sort
  switch (sortBy.value) {
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

const totalViews = computed(() => {
  return quotes.value.reduce((sum, quote) => sum + (quote.views_count || 0), 0)
})

const totalLikes = computed(() => {
  return quotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
})

// Methods
const loadPublishedQuotes = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/submissions', {
      query: { page, limit: 20, status: 'approved' }
    })

    if (page === 1) {
      quotes.value = response.data || []
    } else {
      quotes.value.push(...(response.data || []))
    }

    hasMore.value = response.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load published quotes:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  await loadPublishedQuotes(currentPage.value + 1)
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
  // Navigate to public quote page
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

// Load data on mount
onMounted(() => {
  loadPublishedQuotes()
})
</script>
