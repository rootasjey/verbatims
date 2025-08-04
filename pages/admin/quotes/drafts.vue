<template>
  <div class="frame flex flex-col h-full">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Draft Quotes
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Manage all user draft quotes that haven't been submitted for review.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search quotes, authors, or users..."
            icon="i-ph-magnifying-glass"
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
            item-value="label"
          />
          <UButton
            btn="outline"
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
      <!-- Loading State -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <UIcon name="i-ph-spinner" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">Loading draft quotes...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQuotes.length === 0 && !loading" class="text-center py-16">
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
        <!-- Scrollable Table Container -->
        <div class="quotes-table-container flex-1 overflow-auto">
          <UTable
            :columns="tableColumns"
            :data="filteredQuotes"
            :loading="loading"
            empty-text="No draft quotes found"
            empty-icon="i-ph-file-dashed"
          >
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
                  <span v-if="cell.row.original.author_name">{{ cell.row.original.author_name }}</span>
                  <span v-if="cell.row.original.author_name && cell.row.original.reference_name">•</span>
                  <span v-if="cell.row.original.reference_name">{{ cell.row.original.reference_name }}</span>
                </div>
              </div>
            </template>

            <!-- User Column -->
            <template #user-cell="{ cell }">
              <div class="flex items-center space-x-2">
                <UAvatar
                  :src="cell.row.original.user_avatar"
                  :alt="cell.row.original.user_name"
                  size="xs"
                  :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ cell.row.original.user_name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ cell.row.original.user_email }}
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
                {{ formatDate(cell.row.original.created_at) }}
              </span>
            </template>

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
  </div>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'
import type { AdminQuote } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Draft Quotes - Admin - Verbatims'
})

const quotes = ref<AdminQuote[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedLanguage = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)

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
      quote.user_name?.toLowerCase().includes(query)
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
  },
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
  }
]

const loadQuotes = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/quotes', {
      query: {
        status: 'draft',
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        language: selectedLanguage.value || undefined
      }
    })
    
    quotes.value = (response.data || []).map((q: any) => ({
      ...q,
      user_name: q.user_name ?? '',
      user_email: q.user_email ?? '',
      user_avatar: q.user_avatar ?? ''
    }))
    
    totalQuotes.value = response.pagination?.total || 0
  } catch (error) {
    console.error('Failed to load draft quotes:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = ''
  currentPage.value = 1
}

const getQuoteActions = (quote: AdminQuote) => [
  {
    label: 'View Details',
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
    label: 'Delete Draft',
    leading: 'i-ph-trash',
    click: () => deleteDraft(quote)
  }
]

const viewQuote = (quote: AdminQuote) => {
  // TODO: Open quote detail modal
  console.log('View quote:', quote.id)
}

const editQuote = (quote: AdminQuote) => {
  // TODO: Open quote edit modal
  console.log('Edit quote:', quote.id)
}

const deleteDraft = async (quote: AdminQuote) => {
  // TODO: Implement delete draft functionality
  console.log('Delete draft:', quote.id)
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

watchDebounced([currentPage, searchQuery, selectedLanguage], () => {
  loadQuotes()
}, { debounce: 300 })

onMounted(() => {
  loadQuotes()
})
</script>

<style scoped>
.quotes-table-container {
  min-height: 400px;
}

.frame {
  height: calc(100vh - 8rem);
}
</style>
