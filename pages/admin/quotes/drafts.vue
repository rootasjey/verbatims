<template>
  <div class="frame flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search quotes, authors, or users..."
            leading="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
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
          <UButton
            btn="outline-gray"
            size="sm"
            @click="resetFilters"
          >
            <UIcon name="i-ph-x" />
            Reset
          </UButton>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-file-dashed" class="w-5 h-5 text-gray-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Drafts</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalQuotes }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-users" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Contributors</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ uniqueContributors }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-calendar" class="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ thisWeekCount }}</p>
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
        <UIcon name="i-ph-file-dashed" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching draft quotes' : 'No draft quotes found' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Users haven\'t created any draft quotes yet.' }}
        </p>
      </div>

      <!-- Quotes Table -->
      <div v-else class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
        <!-- Bulk Actions (animated) -->
        <UCollapsible v-model:open="bulkOpen">
          <UCollapsibleContent>
            <div class="flex-shrink-0 mb-4">
              <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'draft' : 'drafts' }} selected
                  </span>
                  <div class="flex items-center gap-3">
                    <UButton size="sm" btn="ghost-blue" :loading="bulkProcessing" @click="bulkSubmit">
                      <UIcon name="i-ph-paper-plane-tilt" />
                      Submit Selected
                    </UButton>
                    <UButton size="sm" btn="ghost-pink" :loading="bulkProcessing" @click="showBulkDeleteModal = true">
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
          </UCollapsibleContent>
        </UCollapsible>

        <!-- Scrollable Table Container -->
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
                <UAvatar
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
              <UBadge color="gray" variant="subtle" size="xs">
                Draft
              </UBadge>
            </template>

            <!-- Date Column -->
            <template #date-cell="{ cell }">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(cell.row.original.created_at) }}
              </span>
            </template>
          </UTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 flex items-center justify-between p-4 border-t border-dashed border-gray-200 dark:border-gray-700">
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

    <AdminQuoteDetailDialog 
      v-model:open="showQuoteDialog" 
      :quote="selectedQuote"
      @edit="editQuote"
    />
  </div>

  <!-- Delete Confirmation Modal -->
  <UDialog v-model:open="showDeleteModal">
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
          <UButton
            color="red"
            :loading="deleting"
            @click="deleteDraft"
          >
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
  title: 'Draft Quotes - Admin - Verbatims'
})

const selectedQuote = ref<AdminQuote | null>(null)
const showQuoteDialog = ref(false)
const showEditQuoteDialog = ref(false)

const quotes = ref<AdminQuote[]>([])
const loading = ref(true)
const hasLoadedOnce = ref(false)
const searchQuery = ref('')
const selectedLanguage = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const deleting = ref(false)
const bulkProcessing = ref(false)
const bulkOpen = ref(false)

// Selection state
const selectionMode = ref(false)
const rowSelection = ref<Record<string, boolean>>({})
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

// Smoothly show/hide bulk actions based on selection
watch(selectedQuotes, (ids) => {
  bulkOpen.value = ids.length > 0
}, { immediate: true })

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

  if (selectedLanguage.value) {
    filtered = filtered.filter(quote => quote.language === selectedLanguage.value)
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
  return quotes.value.filter(q => new Date(q.created_at) >= oneWeekAgo).length
})

const tableColumns = [
  {
    header: '',
    accessorKey: 'actions',
    enableSorting: false,
    meta: {
      una: {
  tableHead: 'w-6',
  tableCell: 'w-6'
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
  }
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
        language: selectedLanguage.value || undefined
      }
    })
    
    quotes.value = response.data || []
    totalQuotes.value = response.pagination?.total || 0
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
  selectedLanguage.value = ''
  currentPage.value = 1
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
  try {
    await $fetch(`/api/admin/quotes/${quote.id}/submit`, {
      method: 'POST'
    } as any)

    quotes.value = quotes.value.filter(q => q.id !== quote.id)
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
  // Refresh the quotes list to show updated data
  loadQuotes()
}

const confirmDelete = (quote: AdminQuote) => {
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

const clearSelection = () => {
  rowSelection.value = {}
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    clearSelection()
  }
}

const setRowSelected = (id: number, value: boolean | 'indeterminate') => {
  rowSelection.value[id] = value === true
}

const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

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
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.quotes-table-container {
  min-height: 400px;
  max-height: calc(100vh - 22rem);
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
