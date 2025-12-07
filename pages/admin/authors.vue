<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <NInput
            v-model="searchQuery"
            placeholder="Search authors by name, job, or description..."
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
          <NSelect
            v-model="selectedFictionalFilter"
            :items="fictionalFilterOptions"
            placeholder="All Types"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <NSelect
            v-model="selectedSort"
            :items="sortOptions"
            placeholder="Sort by"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <NButton
            btn="soft-blue"
            @click="showAddAuthorDialog = true"
            size="sm"
          >
            <NIcon name="i-ph-plus" class="w-4 h-4 mr-2" />
            Create Author
          </NButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-user" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Authors</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalAuthors }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-mask-happy" class="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Fictional</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalFictional }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-quotes" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quotes</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalQuotes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex items-center justify-between mt-6">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
          <NToggle
            v-model="isCardView"
            :label="isCardView ? 'i-ph-squares-four' : 'i-ph-table'"
            size="sm"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ isCardView ? 'Card View' : 'Table View' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Card View -->
    <div v-if="isCardView" class="flex-1 overflow-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div
          v-for="author in filteredAuthors"
          :key="author.id"
          class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <img
                v-if="author.image_url"
                :src="author.image_url"
                :alt="author.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              >
                <NIcon name="i-ph-user" class="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ author.name }}
              </h3>
              <p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ author.job }}
              </p>
              <div class="flex items-center space-x-2 mt-1">
                <span v-if="author.is_fictional" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                  Fictional
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ author.quotes_count || 0 }} quotes
                </span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex justify-end space-x-2">
            <NButton
              size="xs"
              btn="ghost"
              @click="editAuthor(author)"
            >
              <NIcon name="i-ph-pencil" class="w-3 h-3 mr-1" />
              Edit
            </NButton>
            <NButton
              size="xs"
              btn="ghost"
              @click="viewAuthor(author)"
            >
              <NIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
              View
            </NButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
      <!-- Bulk Actions -->
      <NCollapsible v-model:open="bulkOpen" class="px-4 py-2">
        <NCollapsibleContent>
          <div class="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 border border-dashed border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 text-sm">
              <NIcon name="i-ph-check-square" class="w-4 h-4" />
              <span>{{ selectedIds.length }} selected</span>
            </div>
            <div class="flex items-center gap-2">
              <NButton size="xs" btn="ghost" @click="clearSelection">Clear</NButton>
              <NButton size="xs" btn="soft-red" :loading="bulkProcessing" @click="showBulkDeleteDialog = true">
                <NIcon name="i-ph-trash" class="w-3.5 h-3.5 mr-1" /> Delete selected
              </NButton>
            </div>
          </div>
        </NCollapsibleContent>
      </NCollapsible>

      <!-- Scrollable Table Container -->
      <div class="authors-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="filteredAuthors"
          :loading="loading"
          manual-pagination
          empty-text="No authors found"
          empty-icon="i-ph-user"
        >
          <template #actions-header>
            <div class="flex items-center justify-center">
              <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                <NButton icon btn="ghost-gray" size="2xs" :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'" @click="toggleSelectionMode" />
              </NTooltip>
              <NTooltip class="ml-2" text="Select all on page">
                <NCheckbox :model-value="allSelectedOnPage" @update:model-value="selectAllOnPage" />
              </NTooltip>
            </div>
          </template>
          <!-- Actions Column -->
          <template #actions-cell="{ cell }">
            <template v-if="!selectionMode">
              <NDropdownMenu :items="getAuthorActions(cell.row.original)">
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
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template>

          <!-- Author Column -->
          <template #author-cell="{ cell }">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <img
                  v-if="cell.row.original.image_url"
                  :src="cell.row.original.image_url"
                  :alt="cell.row.original.name"
                  class="w-8 h-8 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                  <NIcon name="i-ph-user" class="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ cell.row.original.name }}
                </p>
                <p v-if="cell.row.original.job" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ cell.row.original.job }}
                </p>
              </div>
            </div>
          </template>

          <!-- Type Column -->
          <template #type-cell="{ cell }">
            <span v-if="cell.row.original.is_fictional" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
              Fictional
            </span>
            <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              Real
            </span>
          </template>

          <!-- Quotes Column -->
          <template #quotes-cell="{ cell }">
            <span class="text-sm text-gray-900 dark:text-white">
              {{ cell.row.original.quotes_count || 0 }}
            </span>
          </template>

          <!-- Created Column -->
          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatRelativeTime(cell.row.original.created_at) }}
            </span>
          </template>
        </UTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalAuthors }} total authors
        </div>
        <UPagination
          v-model:page="currentPage"
          :total="totalAuthors"
          :items-per-page="pageSize"
          :sibling-count="2"
          show-edges
          size="sm"
        />
      </div>
    </div>
  </div>

  <AddAuthorDialog
    v-model="showAddAuthorDialog"
    :edit-author="selectedAuthor"
    @author-added="onAuthorAdded"
    @author-updated="onAuthorUpdated"
  />
  
  <DeleteAuthorDialog
    v-model="showDeleteAuthorDialog"
    :author="authorToDelete"
    @author-deleted="onAuthorDeleted"
  />

  <!-- Bulk Delete Confirmation -->
  <UDialog v-model:open="showBulkDeleteDialog">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Author' : 'Authors' }}</h3>
      </template>
      <div class="space-y-3">
        <p class="text-gray-600 dark:text-gray-400">
          You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'author' : 'authors' }}. If they have related quotes, choose a strategy:
        </p>
        <URadioGroup
          v-model="bulkDeleteStrategy"
          :items="[
            { label: 'Anonymize related quotes (keep quotes, remove author link)', value: 'anonymize' },
            { label: 'Delete related quotes (remove quotes and the author)', value: 'delete' }
          ]"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="ghost" @click="showBulkDeleteDialog = false">Cancel</NButton>
          <NButton btn="soft-red" :loading="bulkProcessing" @click="confirmBulkDelete">Delete All</NButton>
        </div>
      </template>
    </UCard>
  </UDialog>
</template>

<script setup lang="ts">
import type { Author } from '~/types/author'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Authors - Admin - Verbatims'
})

const loading = ref(false)
const authors = ref<Author[]>([])
const totalAuthors = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedFictionalFilter = ref({ label: 'All Types', value: '' })
const selectedSort = ref({ label: 'Name A-Z', value: 'name_asc' })
const isCardView = ref(false)
const showAddAuthorDialog = ref(false)
const selectedAuthor = ref<Author | undefined>()
const showDeleteAuthorDialog = ref(false)
const authorToDelete = ref<Author | null>(null)

// Bulk selection state
const selectionMode = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const bulkOpen = ref(false)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)
const bulkDeleteStrategy = ref<'delete' | 'anonymize'>('anonymize')
const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, (ids) => { bulkOpen.value = ids.length > 0 }, { immediate: true })
const visibleIds = computed<number[]>(() => filteredAuthors.value.map(a => a.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))
const toggleSelectionMode = () => { selectionMode.value = !selectionMode.value; if (!selectionMode.value) rowSelection.value = {} }
const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; selectionMode.value = false }

const fictionalFilterOptions = [
  { label: 'All Types', value: '' },
  { label: 'Real People', value: 'false' },
  { label: 'Fictional Characters', value: 'true' }
]

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_desc' },
  { label: 'Oldest First', value: 'created_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' },
  { label: 'Most Liked', value: 'likes_desc' }
]

const totalPages = computed(() => Math.ceil(totalAuthors.value / pageSize.value))

const totalFictional = computed(() => {
  return authors.value.filter(author => author.is_fictional).length
})

const totalQuotes = computed(() => {
  return authors.value.reduce((sum, author) => sum + ((author as any).quotes_count || 0), 0)
})

const filteredAuthors = computed(() => authors.value)

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
    header: 'Author',
    accessorKey: 'author',
    enableSorting: true,
    meta: {
      una: {
        tableHead: 'min-w-60',
        tableCell: 'min-w-60'
      }
    }
  },
  {
    header: 'Type',
    accessorKey: 'type',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-24',
        tableCell: 'w-24'
      }
    }
  },
  {
    header: 'Quotes',
    accessorKey: 'quotes',
    enableSorting: true,
    meta: {
      una: {
        tableHead: 'w-20',
        tableCell: 'w-20'
      }
    }
  },
  {
    header: 'Created',
    accessorKey: 'created',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  }
]

const loadAuthors = async () => {
  try {
    loading.value = true

    // Parse sort option - handle compound sort keys like 'release_date_desc'
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1)

    const response = await $fetch('/api/admin/authors', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        is_fictional: selectedFictionalFilter.value.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder.toUpperCase()
      }
    })

    authors.value = response.data || []
    totalAuthors.value = response.pagination?.total || 0
  } catch (error) {
    console.error('Failed to load authors:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to load authors',
      toast: 'error'
    })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedFictionalFilter.value = fictionalFilterOptions[0]
  selectedSort.value = sortOptions[0]
  currentPage.value = 1
}

const getAuthorActions = (author: Author) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    onclick: () => viewAuthor(author)
  },
  {
    label: 'Edit Author',
    leading: 'i-ph-pencil',
    onclick: () => editAuthor(author)
  },
  {},
  {
    label: 'Delete Author',
    leading: 'i-ph-trash',
    onclick: () => deleteAuthor(author)
  }
]

const viewAuthor = (author: Author) => {
  navigateTo(`/authors/${author.id}`)
}

const editAuthor = (author: Author) => {
  selectedAuthor.value = author
  showAddAuthorDialog.value = true
}

const deleteAuthor = async (author: Author) => {
  authorToDelete.value = author
  showDeleteAuthorDialog.value = true
}

const onAuthorAdded = () => {
  showAddAuthorDialog.value = false
  selectedAuthor.value = undefined
  loadAuthors()
}

const onAuthorUpdated = () => {
  showAddAuthorDialog.value = false
  selectedAuthor.value = undefined
  loadAuthors()
}

const onAuthorDeleted = () => {
  showDeleteAuthorDialog.value = false
  authorToDelete.value = null
  // Reset to first page if current page becomes empty
  if (authors.value.length <= 1 && currentPage.value > 1) {
    currentPage.value = currentPage.value - 1
  }
  loadAuthors()
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
}

watchDebounced([currentPage, searchQuery, selectedFictionalFilter, selectedSort], () => {
  loadAuthors()
}, { debounce: 300 })

onMounted(() => {
  loadAuthors()
})

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(
      ids.map(id => $fetch(`/api/admin/authors/${id}`, { method: 'DELETE', body: { strategy: bulkDeleteStrategy.value } }))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'warning' : 'success', title: `Deleted ${succeeded} author${succeeded !== 1 ? 's' : ''}`, description: failed ? `${failed} failed` : undefined })
  } catch (e) {
    useToast().toast({ toast: 'error', title: 'Bulk delete failed' })
  } finally {
    bulkProcessing.value = false
    showBulkDeleteDialog.value = false
    rowSelection.value = {}
    selectionMode.value = false
    loadAuthors()
  }
}
</script>

<style scoped>
.authors-table-container {
  max-height: calc(100vh - 20rem);
}
</style>
