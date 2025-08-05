<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Published Quotes
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Manage all approved and published quotes in the system.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search quotes, authors, or references..."
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
        <div class="flex gap-2">
          <USelect
            v-model="selectedLanguage"
            :items="languageOptions"
            placeholder="All Languages"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <USelect
            v-model="selectedSort"
            :items="sortOptions"
            placeholder="Sort by"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="value"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Published</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalQuotes }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-eye" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalViews }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-heart" class="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Likes</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalLikes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <UIcon name="i-ph-spinner" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">Loading published quotes...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQuotes.length === 0 && !loading" class="text-center py-16">
        <UIcon name="i-ph-check-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching published quotes' : 'No published quotes yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Published quotes will appear here once users submit and quotes are approved.' }}
        </p>
      </div>

      <!-- Quotes Table -->
      <div v-else class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
        <!-- Scrollable Table Container -->
        <div class="quotes-table-container flex-1 overflow-auto">
          <UTable
            :columns="tableColumns"
            :data="filteredQuotes"
            :loading="loading"
            manual-pagination
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
              <div class="text-sm">
                <span v-if="cell.row.original.author_name" class="text-gray-900 dark:text-white">
                  {{ cell.row.original.author_name }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-600 italic">
                  Unknown
                </span>
              </div>
            </template>

            <!-- Reference Column -->
            <template #reference-cell="{ cell }">
              <div class="text-sm">
                <span v-if="cell.row.original.reference_name" class="text-gray-900 dark:text-white">
                  {{ cell.row.original.reference_name }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-600 italic">
                  No reference
                </span>
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

            <!-- Stats Column -->
            <template #stats-cell="{ cell }">
              <div class="text-xs space-y-1">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <UIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
                  {{ cell.row.original.views_count || 0 }}
                </div>
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <UIcon name="i-ph-heart" class="w-3 h-3 mr-1" />
                  {{ cell.row.original.likes_count || 0 }}
                </div>
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
                {{ formatRelativeTime(cell.row.original.moderated_at || cell.row.original.created_at) }}
              </span>
            </template>
          </UTable>
        </div>

        <div class="flex-shrink-0 flex items-center justify-between p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Page {{ currentPage }} of {{ totalPages }} • {{ totalQuotes }} total quotes
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
  </div>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'
import type { AdminQuote } from '~/types'
import { formatRelativeTime } from '~/utils/time-formatter'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Published Quotes - Admin - Verbatims'
})

const quotes = ref<AdminQuote[]>([])
const loading = ref(true)
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
          return new Date(b.moderated_at || b.created_at).getTime() - new Date(a.moderated_at || a.created_at).getTime()
        case 'oldest':
          return new Date(a.moderated_at || a.created_at).getTime() - new Date(b.moderated_at || b.created_at).getTime()
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
  }
]

const loadQuotes = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/quotes', {
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
  } catch (error) {
    console.error('Failed to load published quotes:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to load published quotes',
      toast: 'error'
    })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = languageOptions.value[0] // Use the first option from the store (All Languages)
  selectedSort.value = { label: 'Most Recent', value: 'newest' }
  currentPage.value = 1
}

const getQuoteActions = (quote: AdminQuote) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    click: () => viewQuote(quote)
  },
  {
    label: 'Edit Quote',
    leading: 'i-ph-pencil',
    click: () => editQuote(quote)
  },
  {},
  {
    label: 'Unpublish',
    leading: 'i-ph-eye-slash',
    click: () => unpublishQuote(quote)
  }
]

const viewQuote = (quote: AdminQuote) => {
  navigateTo(`/quotes/${quote.id}`)
}

const editQuote = (quote: AdminQuote) => {
  // TODO: Implement quote editing
  console.log('Edit quote:', quote.id)
}

const unpublishQuote = async (quote: AdminQuote) => {
  // TODO: Implement unpublish functionality
  console.log('Unpublish quote:', quote.id)
}

watchDebounced([currentPage, searchQuery, selectedLanguage, selectedSort], () => {
  loadQuotes()
}, { debounce: 300 })

onMounted(() => {
  // Initialize selectedLanguage with the first option from the store
  if (languageOptions.value.length > 0) {
    selectedLanguage.value = languageOptions.value[0]
  }
  loadQuotes()
})
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 20rem);
  max-width: calc(100vw - 20rem);
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
