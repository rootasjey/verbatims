<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Authors
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Manage all authors in the system.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
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
          <USelect
            v-model="selectedFictionalFilter"
            :items="fictionalFilterOptions"
            placeholder="All Types"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="value"
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
          <UButton
            btn="soft-blue"
            @click="showAddAuthorDialog = true"
            size="sm"
          >
            <UIcon name="i-ph-plus" class="w-4 h-4 mr-2" />
            Create Author
          </UButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-user" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Authors</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalAuthors }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-mask-happy" class="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Fictional</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalFictional }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <UIcon name="i-ph-quotes" class="w-5 h-5 text-green-600 mr-2" />
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
          <UToggle
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
                <UIcon name="i-ph-user" class="w-6 h-6 text-gray-500" />
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
            <UButton
              size="xs"
              btn="ghost"
              @click="editAuthor(author)"
            >
              <UIcon name="i-ph-pencil" class="w-3 h-3 mr-1" />
              Edit
            </UButton>
            <UButton
              size="xs"
              btn="ghost"
              @click="viewAuthor(author)"
            >
              <UIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
              View
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
      <!-- Scrollable Table Container -->
      <div class="authors-table-container flex-1 overflow-auto">
        <UTable
          :columns="tableColumns"
          :data="filteredAuthors"
          :loading="loading"
          manual-pagination
          empty-text="No authors found"
          empty-icon="i-ph-user"
        >
          <!-- Actions Column -->
          <template #actions-cell="{ cell }">
            <UDropdownMenu :items="getAuthorActions(cell.row.original)">
              <UButton
                icon
                btn="ghost"
                size="sm"
                label="i-ph-dots-three-vertical"
              />
            </UDropdownMenu>
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
                  <UIcon name="i-ph-user" class="w-4 h-4 text-gray-500" />
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
    const [sortBy, sortOrder] = selectedSort.value.value.split('_')

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
</script>

<style scoped>
.authors-table-container {
  max-height: calc(100vh - 20rem);
  max-width: calc(100vw - 20rem);
}
</style>
