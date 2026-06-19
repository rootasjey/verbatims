<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Published
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalQuotes }} {{ totalQuotes === 1 ? 'quote' : 'quotes' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search quotes, authors, or references..."
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-56"
          />
          <select
            v-model="selectedSort"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select
            v-model="selectedLanguage"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in languageOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <!-- Mobile search -->
      <div class="md:hidden mt-4 flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search published..."
          class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <select
          v-model="selectedSort"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-1 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- First-load Skeleton -->
    <div v-if="!hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? 'No matching published quotes' : 'No published quotes yet' }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Published quotes will appear here once users submit and quotes are approved.' }}
      </p>
    </div>

    <!-- Table -->
    <div v-else-if="hasLoadedOnce">
      <!-- Bulk action bar -->
      <div v-if="selectedQuotes.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedQuotes.length }} selected</span>
        <OutlinedButton size="sm" @click="showBulkEditDialog = true">Edit Selected</OutlinedButton>
        <OutlinedButton size="sm" @click="showBulkAddToCollection = true">Add to Collection</OutlinedButton>
        <button
          class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto"
          @click="clearSelection"
        >
          Clear
        </button>
        <button
          class="font-sans text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          @click="showBulkUnpublishModal = true"
        >
          Unpublish All
        </button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left">
                <NCheckbox
                  checkbox="gray"
                  :model-value="allSelected"
                  @update:model-value="toggleAllSelection"
                />
              </th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quote</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Language</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Stats</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Published</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="(quote, idx) in filteredQuotes"
              :key="quote.id"
              :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined"
              :class="[
                'animate-fade-in-up transition-colors group',
                { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex },
                { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[quote.id] }
              ]"
              :style="{ animationDelay: `${idx * 0.03}s` }"
            >
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox
                    checkbox="gray"
                    :model-value="!!rowSelection[quote.id]"
                    @click="e => handleRowCheckboxClick(e, idx, quote.id)"
                  />
                </div>
              </td>
              <td class="px-3 py-3 max-w-md">
                <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2 mb-1">
                  &ldquo;{{ quote.name }}&rdquo;
                </blockquote>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="quote.author?.name">{{ quote.author.name }}</span>
                  <span v-if="quote.author?.name && quote.reference?.name">&middot;</span>
                  <span v-if="quote.reference?.name">{{ quote.reference.name }}</span>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">
                {{ quote.language || 'N/A' }}
              </td>
              <td class="px-3 py-3">
                <span v-if="quote.user_name" class="font-sans text-sm text-gray-900 dark:text-gray-100">
                  {{ quote.user_name }}
                </span>
                <span v-else class="font-sans text-sm text-gray-400 dark:text-gray-500 italic">
                  Unknown
                </span>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center gap-1"><NIcon name="i-ph-eye" class="w-3 h-3" />{{ quote.views_count || 0 }}</span>
                  <span class="flex items-center gap-1"><NIcon name="i-ph-heart" class="w-3 h-3" />{{ quote.likes_count || 0 }}</span>
                </div>
              </td>
              <td class="px-3 py-3">
                <span class="font-sans text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5">Published</span>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(quote.moderated_at || quote.created_at) }}
              </td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getQuoteActions(quote)">
                  <button
                    @click.stop
                    class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" />
                  </button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalQuotes }} {{ totalQuotes === 1 ? 'quote' : 'quotes' }}
        </span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
        </div>
      </div>
      <div v-else class="pt-4 text-center">
        <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">No more pages to show</span>
      </div>
    </div>

    <AddQuoteDialog
      v-model="showEditQuoteDialog"
      :edit-quote="selectedQuote"
      @quote-updated="onQuoteUpdated"
    />

    <AddToCollectionBulkModal
      v-if="selectedQuotes.length > 0"
      v-model="showBulkAddToCollection"
      :quote-ids="selectedQuotes"
      @added="handleBulkAddedToCollection"
    />

    <BulkEditQuotesDialog
      v-model:open="showBulkEditDialog"
      :selected-quotes="selectedQuotesData"
      @updated="onBulkEditComplete"
    />

    <NDialog v-model:open="showBulkUnpublishModal">
      <template #header>
        <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Unpublish {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'Quote' : 'Quotes' }}</h3>
      </template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400">
        Are you sure you want to unpublish {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }}?
        They will be moved back to drafts.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkUnpublishModal = false">Cancel</button>
          <OutlinedButton variant="destructive" @click="bulkUnpublish(); showBulkUnpublishModal = false">Unpublish All</OutlinedButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'
import { formatRelativeTime, getDateTimestamp } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { useErrorToast } from '~/composables/useErrorToast'

const { showErrorToast } = useErrorToast()

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
    value: lang.value === 'all' ? '' : lang.value
  }))
)

const selectedLanguage = ref({ label: 'All Languages', value: '' })

const selectedQuote = ref<AdminQuote | undefined>(undefined)
const showEditQuoteDialog = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed<AdminQuote[]>(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)
const showBulkAddToCollection = ref(false)
const showBulkEditDialog = ref(false)
const showBulkUnpublishModal = ref(false)

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

  if (selectedSort.value.value) {
    filtered = [...filtered].sort((a, b) => {
      switch (selectedSort.value.value) {
        case 'newest':
          return getDateTimestamp(b.moderated_at || b.created_at) - getDateTimestamp(a.moderated_at || a.created_at)
        case 'oldest':
          return getDateTimestamp(a.moderated_at || a.created_at) - getDateTimestamp(b.moderated_at || b.created_at)
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

const loadQuotes = async () => {
  try {
    loading.value = true
    type AdminQuotesResponse = {
      success: boolean
      data: AdminQuote[]
      pagination?: { total?: number }
    }

    const response = await $fetch<AdminQuotesResponse>('/api/admin/quotes', {
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
    rowSelection.value = {}
    clearHighlight()
  } catch (error) {
    console.error('Failed to load published quotes:', error)
    showErrorToast(error, 'Failed to load published quotes')
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = languageOptions.value[0]
  selectedSort.value = { label: 'Most Recent', value: 'newest' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
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
  navigateTo(`/quotes/${quote.id}`)
}

const editQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = undefined
  loadQuotes()
}

const onBulkEditComplete = () => {
  showBulkEditDialog.value = false
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes()
}

const unpublishQuote = async (quote: AdminQuote) => {
  try {
    await $fetch('/api/admin/quotes/unpublish', {
      method: 'POST',
      body: { id: quote.id }
    })
    await loadQuotes()
  } catch (e) {
    console.error('Unpublish failed:', e)
    showErrorToast(e, 'Failed to unpublish quote')
  }
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }

const selectAllOnPage = () => {
  if (allSelectedOnPage.value) rowSelection.value = {}
  else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

const isAnyDialogOpen = computed(() =>
  showEditQuoteDialog.value || showBulkAddToCollection.value ||
  showBulkEditDialog.value || showBulkUnpublishModal.value
)

const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = filteredQuotes.value.length
    const count = selectedQuotes.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSel: Record<number, boolean> = {}
    if (v === true) {
      filteredQuotes.value.forEach(q => { newSel[q.id] = true })
    }
    rowSelection.value = newSel
    lastSelectedIndex.value = null
  }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSel: Record<number, boolean> = {}
    filteredQuotes.value.forEach(q => { newSel[q.id] = true })
    rowSelection.value = newSel
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => filteredQuotes.value.length,
  onSelectRow: (index: number) => {
    const quote = filteredQuotes.value[index]
    if (quote) {
      rowSelection.value[quote.id] = !rowSelection.value[quote.id]
      lastSelectedIndex.value = null
    }
  },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false
})

const highlightedQuote = computed<AdminQuote | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return filteredQuotes.value[highlightedRowIndex.value] ?? null
})

useAdminKeyboardShortcuts({
  selectAllOnPage,
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onEdit: () => { showBulkEditDialog.value = true },
  onDelete: () => { showBulkUnpublishModal.value = true },
  onConfirmDialog: () => {
    if (showBulkUnpublishModal.value) { bulkUnpublish(); showBulkUnpublishModal.value = false }
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  onSingleDelete: () => {
    if (highlightedQuote.value) unpublishQuote(highlightedQuote.value)
  }
})

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = filteredQuotes.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }
  lastSelectedIndex.value = index
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
    clearSelection()
    await loadQuotes()
  } catch (e) {
    console.error('Bulk unpublish failed:', e)
    showErrorToast(e, 'Failed to unpublish selected quotes')
  }
}

watchDebounced([currentPage, searchQuery, selectedLanguage, selectedSort], () => {
  loadQuotes()
}, { debounce: 300, immediate: true })
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
