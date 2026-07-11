<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalQuotes }} {{ totalQuotes === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_placeholder') as string"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-56"
          />
          <select
            v-model="statusFilter"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select
            v-model="selectedLanguage"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in languageOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div class="md:hidden mt-4 flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('search_placeholder_mobile') as string"
          class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <select
          v-model="statusFilter"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-1 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="!hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? $t('empty_search_desc') : $t('empty_desc') }}
      </p>
    </div>

    <!-- Table -->
    <div v-else-if="hasLoadedOnce">
      <!-- Bulk action bar -->
      <div v-if="selectedQuotes.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('common.selected_count', { count: selectedQuotes.length }) }}</span>
        <OutlinedButton size="sm" @click="showBulkEditDialog = true">{{ $t('bulk_edit') }}</OutlinedButton>
        <OutlinedButton size="sm" variant="primary" @click="showBulkApproveModal = true">{{ $t('bulk_approve') }}</OutlinedButton>
        <OutlinedButton size="sm" variant="destructive" @click="showBulkRejectModal = true">{{ $t('bulk_reject') }}</OutlinedButton>
        <button
          class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto"
          @click="clearSelection"
        >
          {{ $t('common.clear') }}
        </button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left">
                <NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" />
              </th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('common.quote_singular') }}</th>
              <th class="w-48 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_user') }}</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_language') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('common.status') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_submitted') }}</th>
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
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[quote.id]" @click="handleRowCheckboxClick($event, idx, quote.id)" />
                </div>
              </td>
              <td class="px-3 py-3 max-w-md">
                <ContextMenu size="xs" :items="getQuoteActions(quote)">
                  <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2 mb-1">
                    &ldquo;{{ quote.name }}&rdquo;
                  </blockquote>
                </ContextMenu>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <template v-if="quote.author_name">
                    <ContextMenu v-if="quote.author_id" size="xs" :items="getAuthorActions(quote)">
                      <span class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ quote.author_name }}</span>
                    </ContextMenu>
                    <span v-else>{{ quote.author_name }}</span>
                  </template>
                  <span v-if="quote.author_name && quote.reference_name">&middot;</span>
                  <template v-if="quote.reference_name">
                    <ContextMenu v-if="quote.reference_id" size="xs" :items="getReferenceActions(quote)">
                      <span class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ quote.reference_name }}</span>
                    </ContextMenu>
                    <span v-else>{{ quote.reference_name }}</span>
                  </template>
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2">
                  <NAvatar :src="quote.user_avatar" :alt="quote.user_name" size="xs" />
                  <div>
                    <p class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ quote.user_name }}</p>
                    <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.user_email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ quote.language || $t('common.na') }}</td>
              <td class="px-3 py-3">
                <div class="space-y-1">
                  <span class="font-sans text-xs px-1.5 py-0.5" :class="statusPillClass(quote.status)">{{ quote.status }}</span>
                  <div v-if="quote.status === 'rejected' && quote.rejection_reason" class="font-sans text-xs text-red-600 dark:text-red-400">
                    {{ quote.rejection_reason.substring(0, 30) }}{{ quote.rejection_reason.length > 30 ? '...' : '' }}
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(quote.created_at) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getQuoteActions(quote)">
                  <button @click.stop class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" />
                  </button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
          {{ $t('common.page_of', { n: currentPage, m: totalPages }) }} &middot; {{ totalQuotes }} {{ totalQuotes === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}
        </span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; {{ $t('common.previous') }}</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.first_page') }}</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }} &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.last_page') }}</span>
        </div>
      </div>
      <div v-else class="pt-4 text-center">
          <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.no_more_pages') }}</span>
      </div>
    </div>

    <ClientOnly>
      <AdminQuoteDetailDialog v-model:open="showQuoteDialog" :quote="selectedQuote" @edit="editQuote" />
    </ClientOnly>

    <!-- Reject Quote Modal -->
    <ClientOnly>
      <NDialog v-model:open="showRejectModal">
        <template #header>
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Reject Quote</h3>
        </template>
        <div class="space-y-4">
          <div v-if="selectedQuote" class="p-3 bg-gray-50 dark:bg-gray-900">
            <blockquote class="font-sans text-sm font-500 text-gray-900 dark:text-white">&ldquo;{{ selectedQuote.name }}&rdquo;</blockquote>
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">by {{ selectedQuote.user_name }}</p>
          </div>
          <div>
            <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Rejection Reason <span class="text-red-500">*</span></label>
            <textarea
              v-model="rejectionReason"
              placeholder="Please provide a reason for rejecting this quote..."
              rows="3"
              class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 resize-none"
              :disabled="processing.has(selectedQuote?.id)"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showRejectModal = false" :disabled="processing.has(selectedQuote?.id)">Cancel</button>
            <OutlinedButton variant="destructive" :disabled="processing.has(selectedQuote?.id)" @click="confirmRejectQuote">Reject Quote</OutlinedButton>
          </div>
        </template>
      </NDialog>
    </ClientOnly>

    <!-- Bulk Reject Modal -->
    <ClientOnly>
      <NDialog v-model:open="showBulkRejectModal">
        <template #header>
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Reject {{ selectedQuotes.length }} Quotes</h3>
        </template>
        <div class="space-y-4">
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400">You are about to reject {{ selectedQuotes.length }} quotes. This action cannot be undone.</p>
          <div>
            <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Rejection Reason <span class="text-red-500">*</span></label>
            <textarea
              v-model="bulkRejectionReason"
              placeholder="Please provide a reason for rejecting these quotes..."
              rows="3"
              class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 resize-none"
              :disabled="bulkProcessing"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkRejectModal = false" :disabled="bulkProcessing">Cancel</button>
            <OutlinedButton variant="destructive" :disabled="bulkProcessing" @click="confirmBulkReject">Reject All</OutlinedButton>
          </div>
        </template>
      </NDialog>
    </ClientOnly>

    <ClientOnly>
      <AddQuoteDialog v-model="showEditQuoteDialog" :edit-quote="selectedQuote" @quote-updated="onQuoteUpdated" />
    </ClientOnly>
    <ClientOnly>
      <BulkEditQuotesDialog v-model:open="showBulkEditDialog" :selected-quotes="selectedQuotesData" @updated="onBulkEditComplete" />
    </ClientOnly>

    <ClientOnly>
      <NDialog v-model:open="showBulkApproveModal">
        <template #header>
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Approve {{ selectedQuotes.length }} Quotes</h3>
        </template>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">Are you sure you want to approve {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }}?</p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" :disabled="bulkProcessing" @click="showBulkApproveModal = false">Cancel</button>
            <OutlinedButton variant="primary" :disabled="bulkProcessing" @click="bulkApprove(); showBulkApproveModal = false">Approve All</OutlinedButton>
          </div>
        </template>
      </NDialog>
    </ClientOnly>

    <ClientOnly>
      <AddAuthorDialog
        v-model="showEditAuthorDialog"
        :edit-author="authorToEdit"
        @author-updated="onAuthorUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <AddReferenceDialog
        v-model="showEditReferenceDialog"
        :edit-reference="referenceToEdit"
        @reference-updated="onReferenceUpdated"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import type { LanguageOption } from '~/stores/language'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { useErrorToast } from '~/composables/useErrorToast'

const { showErrorToast } = useErrorToast()

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string
})

const quotes = ref<any[]>([])
const loading = ref(true)
const bulkProcessing = ref(false)
const hasLoadedOnce = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
const totalPages = ref(0)
const searchQuery = ref('')
const statusFilter = ref({ label: 'Pending Review', value: 'pending' })
const selectedLanguage = ref({ label: 'All Languages', value: '' })
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const processing = ref(new Set<number>())

const showRejectModal = ref(false)
const showBulkRejectModal = ref(false)
const showBulkEditDialog = ref(false)
const showBulkApproveModal = ref(false)
const showEditQuoteDialog = ref(false)
const showQuoteDialog = ref(false)
const selectedQuote = ref<any>(null)
const rejectionReason = ref('')
const bulkRejectionReason = ref('')

const statusOptions = [
  { label: 'Pending Review', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

const { availableLanguages } = useLanguageStore()
const languageOptions = computed(() =>
  (availableLanguages ?? []).map((lang: LanguageOption) => ({
    label: lang.display,
    value: lang.value === 'all' ? '' : lang.value
  }))
)

const pendingCount = computed(() => quotes.value.filter((q: any) => q.status === 'pending').length)

const uniqueContributors = computed(() => {
  const contributors = new Set(quotes.value.map((q: any) => q.user_id).filter(Boolean))
  return contributors.size
})

const filteredQuotes = computed(() => {
  let filtered = quotes.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((q: any) =>
      q.name.toLowerCase().includes(query) ||
      q.author_name?.toLowerCase().includes(query) ||
      q.reference_name?.toLowerCase().includes(query) ||
      q.user_name?.toLowerCase().includes(query)
    )
  }
  if (statusFilter.value.value) {
    filtered = filtered.filter((q: any) => q.status === statusFilter.value.value)
  }
  if (selectedLanguage.value.value) {
    filtered = filtered.filter((q: any) => q.language === selectedLanguage.value.value)
  }
  return filtered
})

const visibleIds = computed<number[]>(() => filteredQuotes.value.map((q: any) => q.id))
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
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      filteredQuotes.value.forEach((q: any) => { newSelection[q.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null
  }
})

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSel: Record<number, boolean> = {}
    filteredQuotes.value.forEach((q: any) => { newSel[q.id] = true })
    rowSelection.value = newSel
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const selectAllOnPage = () => {
  if (allSelectedOnPage.value) rowSelection.value = {}
  else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const selectedQuotes = computed(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed(() =>
  quotes.value.filter((quote: any) => selectedQuotes.value.includes(quote.id))
)

const isAnyDialogOpen = computed(() =>
  showQuoteDialog.value || showRejectModal.value || showBulkRejectModal.value ||
  showBulkEditDialog.value || showEditQuoteDialog.value || showBulkApproveModal.value
)

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

const highlightedQuote = computed<any | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return filteredQuotes.value[highlightedRowIndex.value] ?? null
})

function repositionHighlightAfterRemoval(previousIndex: number | null) {
  if (previousIndex === null) return
  nextTick(() => {
    const count = filteredQuotes.value.length
    if (count === 0) highlightedRowIndex.value = null
    else highlightedRowIndex.value = Math.min(Math.max(0, previousIndex - 1), count - 1)
  })
}

useAdminKeyboardShortcuts({
  selectAllOnPage,
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onEdit: () => { showBulkEditDialog.value = true },
  customKeys: {
    a: () => { showBulkApproveModal.value = true },
    r: () => { showBulkRejectModal.value = true }
  },
  onConfirmDialog: () => {
    if (showBulkRejectModal.value) confirmBulkReject()
    else if (showBulkApproveModal.value) { bulkApprove(); showBulkApproveModal.value = false }
    else if (showRejectModal.value) confirmRejectQuote()
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  customSingleKeys: {
    a: () => {
      if (highlightedQuote.value) {
        const previousIndex = highlightedRowIndex.value
        approveQuote(highlightedQuote.value).then(() => repositionHighlightAfterRemoval(previousIndex))
      }
    },
    r: () => {
      if (highlightedQuote.value) quickRejectQuote(highlightedQuote.value)
    }
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

const loadQuotes = async (page = 1) => {
  try {
    loading.value = true
    const params: any = { page, limit: pageSize.value, status: statusFilter.value.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedLanguage.value.value) params.language = selectedLanguage.value.value

    const response = await $fetch('/api/admin/quotes/pending', { query: params })

    quotes.value = response?.data || []
    rowSelection.value = {}
    clearHighlight()
    totalQuotes.value = response?.pagination?.total || 0
    pageSize.value = response?.pagination?.limit || pageSize.value
    totalPages.value = response?.pagination?.totalPages || Math.ceil((response?.pagination?.total || 0) / (response?.pagination?.limit || pageSize.value))
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load quotes:', error)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = { label: 'Pending Review', value: 'pending' }
  selectedLanguage.value = { label: 'All Languages', value: '' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

watchDebounced([searchQuery, statusFilter, selectedLanguage], () => {
  currentPage.value = 1
  loadQuotes(1)
}, { debounce: 300 })

watch(currentPage, () => { loadQuotes(currentPage.value) })

const approveQuote = async (quote: any) => {
  try {
    processing.value.add(quote.id)
    await $fetch(`/api/admin/quotes/${quote.id}/moderate`, {
      method: 'POST',
      body: { action: 'approve' }
    })
    if (statusFilter.value?.value === 'pending') {
      quotes.value = quotes.value.filter((q: any) => q.id !== quote.id)
    } else {
      const index = quotes.value.findIndex((q: any) => q.id === quote.id)
      if (index !== -1) quotes.value[index].status = 'approved'
    }
  } catch (error) {
    console.error('Failed to approve quote:', error)
    showErrorToast(error, 'Failed to approve quote')
  } finally {
    processing.value.delete(quote.id)
  }
}

const rejectQuote = (quote: any) => {
  selectedQuote.value = quote
  rejectionReason.value = ''
  showRejectModal.value = true
}

const confirmRejectQuote = async () => {
  if (!selectedQuote.value || !rejectionReason.value.trim()) return
  try {
    processing.value.add(selectedQuote.value.id)
    const response = await $fetch(`/api/admin/quotes/${selectedQuote.value.id}/moderate`, {
      method: 'POST',
      body: { action: 'reject', rejection_reason: rejectionReason.value.trim() }
    })
    onQuoteRejected(response?.data)
    showRejectModal.value = false
    rejectionReason.value = ''
  } catch (error) {
    console.error('Failed to reject quote:', error)
    showErrorToast(error, 'Failed to reject quote')
  } finally {
    processing.value.delete(selectedQuote.value.id)
  }
}

const quickRejectQuote = async (quote: any) => {
  const previousIndex = highlightedRowIndex.value
  try {
    processing.value.add(quote.id)
    const response = await $fetch(`/api/admin/quotes/${quote.id}/moderate`, {
      method: 'POST',
      body: { action: 'reject', rejection_reason: '' }
    })
    onQuoteRejected(response?.data)
    repositionHighlightAfterRemoval(previousIndex)
  } catch (error) {
    console.error('Failed to reject quote:', error)
    showErrorToast(error, 'Failed to reject quote')
  } finally {
    processing.value.delete(quote.id)
  }
}

const bulkApprove = async () => {
  if (selectedQuotes.value.length === 0) return
  try {
    bulkProcessing.value = true
    await $fetch('/api/admin/quotes/bulk-moderate', {
      method: 'POST',
      body: { quote_ids: selectedQuotes.value, action: 'approve' }
    })
    if (statusFilter.value?.value === 'pending') {
      quotes.value = quotes.value.filter((q: any) => !selectedQuotes.value.includes(q.id))
    }
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk approve quotes:', error)
    showErrorToast(error, 'Failed to bulk approve quotes')
  } finally {
    bulkProcessing.value = false
  }
}

const confirmBulkReject = async () => {
  if (selectedQuotes.value.length === 0 || !bulkRejectionReason.value.trim()) return
  try {
    bulkProcessing.value = true
    await $fetch('/api/admin/quotes/bulk-moderate', {
      method: 'POST',
      body: { quote_ids: selectedQuotes.value, action: 'reject', rejection_reason: bulkRejectionReason.value.trim() }
    })
    onBulkRejected()
    showBulkRejectModal.value = false
    bulkRejectionReason.value = ''
  } catch (error) {
    console.error('Failed to bulk reject quotes:', error)
    showErrorToast(error, 'Failed to bulk reject quotes')
  } finally {
    bulkProcessing.value = false
  }
}

const onQuoteRejected = (rejectedQuote: any) => {
  if (statusFilter.value?.value === 'pending') {
    quotes.value = quotes.value.filter((q: any) => q.id !== rejectedQuote.id)
  } else {
    const index = quotes.value.findIndex((q: any) => q.id === rejectedQuote.id)
    if (index !== -1) quotes.value[index] = rejectedQuote
  }
}

const onBulkRejected = () => {
  if (statusFilter.value?.value === 'pending') {
    quotes.value = quotes.value.filter((q: any) => !selectedQuotes.value.includes(q.id))
  }
  rowSelection.value = {}
}

const getQuoteActions = (quote: any): any[] => {
  const actions: any[] = [
    { label: 'View Details', leading: 'i-ph-eye', onclick: () => viewQuote(quote) },
    { label: 'Edit Quote', leading: 'i-ph-pencil', onclick: () => editQuote(quote) }
  ]
  if (quote.status === 'pending') {
    actions.push(
      {},
      { label: 'Approve', leading: 'i-ph-check', onclick: () => approveQuote(quote) },
      { label: 'Reject', leading: 'i-ph-x', onclick: () => rejectQuote(quote) }
    )
  }
  return actions
}

const showEditAuthorDialog = ref(false)
const authorToEdit = ref<Author | null>(null)

const editAuthor = (authorId: number) => {
  authorToEdit.value = { id: authorId } as Author
  showEditAuthorDialog.value = true
}

const onAuthorUpdated = () => {
  showEditAuthorDialog.value = false
  authorToEdit.value = null
  loadQuotes()
}

const getAuthorActions = (quote: any) => {
  const authorId = quote.author_id
  if (!authorId) return []
  return [
    { label: 'Edit Author', leading: 'i-ph-pencil', onclick: () => editAuthor(authorId) },
    { label: 'View Author Page', leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${authorId}`) }
  ]
}

const showEditReferenceDialog = ref(false)
const referenceToEdit = ref<QuoteReference | null>(null)

const editReference = (referenceId: number) => {
  referenceToEdit.value = { id: referenceId } as QuoteReference
  showEditReferenceDialog.value = true
}

const onReferenceUpdated = () => {
  showEditReferenceDialog.value = false
  referenceToEdit.value = null
  loadQuotes()
}

const getReferenceActions = (quote: any) => {
  const refId = quote.reference_id
  if (!refId) return []
  return [
    { label: 'Edit Reference', leading: 'i-ph-pencil', onclick: () => editReference(refId) },
    { label: 'View Reference Page', leading: 'i-ph-eye', onclick: () => navigateTo(`/references/${refId}`) }
  ]
}

const statusPillClass = (status: string) => {
  switch (status) {
    case 'approved': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'rejected': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    case 'pending': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

const viewQuote = (quote: any) => {
  selectedQuote.value = quote
  showQuoteDialog.value = true
}

const editQuote = (quote: any) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = null
  loadQuotes()
}

const onBulkEditComplete = () => {
  showBulkEditDialog.value = false
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes()
}

onMounted(() => { loadQuotes() })
</script>

<style scoped>
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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
