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
            value-key="label"
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
        <!-- Bulk Actions -->
        <div v-if="selectedQuotes.length > 0" class="flex-shrink-0 mb-4">
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
                <UButton size="sm" btn="soft-pink" @click="bulkUnpublish">
                  <UIcon name="i-ph-eye-slash" />
                  Unpublish
                </UButton>
                <UButton size="sm" btn="ghost-gray" @click="clearSelection">
                  Clear Selection
                </UButton>
              </div>
            </div>
          </div>
        </div>
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
// Selection state
const selectionMode = ref(false)
const rowSelection = ref<Record<string, boolean>>({})
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))
// Bulk modal
const showBulkAddToCollection = ref(false)

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

// Helpers derived from dashboard page
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

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
    // Reset selection on new data
    rowSelection.value = {}
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
  navigateTo(`/quote/${quote.id}`)
}

const editQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = undefined
  // Refresh the quotes list to show updated data
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

// Selection & Bulk helpers
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

// Keyboard shortcut: Cmd/Ctrl + A to select all (only when selection mode is active)
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

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
  max-height: calc(100vh - 20rem);
  max-width: calc(100vw - 20rem);
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
