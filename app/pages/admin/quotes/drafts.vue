<template>
  <div>
    <!-- Editorial Header -->
    <div data-admin-page-header class="pb-6 mb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Drafts
          </h1>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <AdminSearchToggle v-model="searchQuery" :placeholder="$t('search_placeholder') as string" :close-label="$t('common.close') as string" />
          <NCombobox
            v-model="selectedLanguage"
            :items="languageOptions"
            by="value"
            :_combobox-input="{
              placeholder: $t('common.all_languages') as string,
              class: 'text-xs',
            }"
            :_combobox-list="{
              class: 'min-w-[200px]',
              align: 'end',
            }"
            :_combobox-trigger="{
              btn: 'outline-gray',
              size: 'sm',
              trailing: 'i-lucide-chevron-down',
              class: 'gap-1 px-2 text-sm leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
            }"
          >
            <template #trigger="{ modelValue }">
              <span class="text-xs font-medium leading-none">{{ modelValue?.label || $t('common.all_languages') }}</span>
            </template>
          </NCombobox>
        </div>
      </div>
      <div class="md:hidden mt-4 flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search drafts..."
          class="flex-1 font-sans text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <NCombobox
          v-model="selectedLanguage"
          :items="languageOptions"
          by="value"
          :_combobox-list="{
            class: 'min-w-[200px]',
          }"
          :_combobox-trigger="{
            btn: 'outline-gray',
            size: 'xs',
            trailing: 'i-lucide-chevron-down',
            class: 'gap-1 px-2 text-xs leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
          }"
        >
          <template #trigger="{ modelValue }">
            <span class="text-xs leading-none">{{ modelValue?.label || $t('common.all_languages') }}</span>
          </template>
        </NCombobox>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="!hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? 'No matching draft quotes' : 'No draft quotes found' }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Users haven\'t created any draft quotes yet.' }}
      </p>
    </div>

    <!-- Table -->
    <div v-else-if="hasLoadedOnce">
      <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto">
        <table class="w-full min-w-[760px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left">
                <NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" />
              </th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quote</th>
              <th class="w-48 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Language</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-36 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div class="inline-flex items-center gap-1">
                  <span>{{ $t('col_created') }}</span>
                  <AdminSortButton
                    :direction="draftCreatedSortOrder === 'ASC' ? 'asc' : 'desc'"
                    :ascending-label="$t('sort_oldest_first') as string"
                    :descending-label="$t('sort_most_recent') as string"
                    @toggle="toggleCreatedSort"
                  />
                </div>
              </th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <ContextMenu
              v-for="(quote, idx) in filteredQuotes"
              :key="quote.id"
              as-child
              ignore-interactive-targets
              size="xs"
              native-on-modifier="ctrl"
              :items="getQuoteActions(quote)"
            >
            <tr
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
                <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2 mb-1">
                  {{ quote.name }}
                </blockquote>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <template v-if="quote.author?.name">
                    <ContextMenu v-if="quote.author?.id" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                      <span class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ quote.author.name }}</span>
                    </ContextMenu>
                    <span v-else>{{ quote.author.name }}</span>
                  </template>
                  <span v-if="quote.author?.name && quote.reference?.name">&middot;</span>
                  <template v-if="quote.reference?.name">
                    <ContextMenu v-if="quote.reference?.id" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                      <span class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ quote.reference.name }}</span>
                    </ContextMenu>
                    <span v-else>{{ quote.reference.name }}</span>
                  </template>
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2">
                  <NAvatar :src="quote.user?.avatar_url" :alt="quote.user?.name" size="xs" />
                  <div>
                    <p class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ quote.user?.name }}</p>
                    <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.user?.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">
                <NCombobox
                  :model-value="getLanguageOption(quote.language)"
                  @update:model-value="onLanguageChange(quote, $event)"
                  :items="inlineLanguageOptions"
                  by="value"
                  :_combobox-input="{
                    placeholder: 'Search language...',
                    class: 'text-xs',
                  }"
                  :_combobox-list="{
                    class: 'min-w-[100px]',
                  }"
                  :_combobox-trigger="{
                    btn: 'ghost-gray',
                    size: 'xs',
                    trailing: '',
                    class: 'gap-1 px-1 text-xs font-normal w-full min-w-0 h-auto justify-start',
                  }"
                >
                  <template #trigger="{ modelValue }">
                    {{ modelValue?.label || quote.language }}
                  </template>
                </NCombobox>
              </td>
              <td class="px-3 py-3">
                <span class="font-sans text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md">Draft</span>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(quote.created_at) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getQuoteActions(quote)" :modal="false">
                  <button @click.stop class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" />
                  </button>
                </NDropdownMenu>
              </td>
            </tr>
            </ContextMenu>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1 || selectedQuotes.length > 0" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1 || selectedQuotes.length > 0"
      class="fixed bottom-0 z-20 flex items-center justify-between gap-4 rounded-t-2xl border border-b-0 border-[#d8d4cb] bg-[#e7e4dd] px-5 py-3 shadow-[0_-6px_18px_rgba(12,10,9,0.06)] transition-[left,width] duration-300 ease-in-out dark:border-white/10 dark:bg-[#17191e] sm:px-8 lg:px-12"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="shrink-0 font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="rounded-md px-1.5 py-0.5 font-medium text-gray-800 transition-colors hover:bg-black/5 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }}
      </span>
      <DashboardBulkSelectionControls
        :selection-mode="selectedQuotes.length > 0"
        :selected-count="selectedQuotes.length"
        :visible-count="filteredQuotes.length"
        :actions="bulkSelectionActions"
        @toggle-visible="selectAllOnPage"
        @clear="clearSelection"
        @exit-mode="clearSelection"
        @action="onBulkSelectionAction"
      />
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <NButton v-if="currentPage > 1" btn="outline-gray" size="sm" rounded="full" :aria-label="$t('common.previous') as string" class="px-2 font-sans text-xs transition-transform active:scale-98 sm:px-4" @click="currentPage = Math.max(1, currentPage - 1)">
          <NIcon name="i-tabler-arrow-left" class="h-4 w-4" /><span class="sr-only sm:not-sr-only">{{ $t('common.previous') }}</span>
        </NButton>
        <NButton v-if="currentPage < totalPages" btn="outline-gray" size="sm" rounded="full" :aria-label="$t('common.next') as string" class="px-2 font-sans text-xs transition-transform active:scale-98 sm:px-4" @click="currentPage = Math.min(totalPages, currentPage + 1)">
          <span class="sr-only sm:not-sr-only">{{ $t('common.next') }}</span><NIcon name="i-tabler-arrow-right" class="h-4 w-4" />
        </NButton>
      </div>
    </div>

    <ClientOnly>
      <AdminQuoteDetailDialog v-model:open="showQuoteDialog" :quote="selectedQuote" @edit="editQuote" />
    </ClientOnly>
    <ClientOnly>
      <DeleteDraftDialog v-model:open="showDeleteModal" :deleting="deleting" @delete-draft="deleteDraft" />
    </ClientOnly>
    <ClientOnly>
      <DeleteQuoteInBulkDialog v-model:open="showBulkDeleteModal" :deleting="bulkProcessing" :selected-quotes="selectedQuotesData" @bulk-delete="bulkDelete" />
    </ClientOnly>
    <ClientOnly>
      <BulkEditQuotesDialog v-model:open="showBulkEditDialog" :selected-quotes="selectedQuotesData" @updated="onBulkEditComplete" />
    </ClientOnly>
    <ClientOnly>
      <AddQuoteDialog v-model="showEditQuoteDialog" :edit-quote="selectedQuote" @quote-updated="onQuoteUpdated" />
    </ClientOnly>

    <ClientOnly>
      <NDialog v-model:open="showBulkSubmitModal">
        <template #header>
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Submit {{ selectedQuotes.length }} Drafts</h3>
        </template>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">Are you sure you want to submit {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'draft' : 'drafts' }} for review?</p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" :disabled="bulkProcessing" @click="showBulkSubmitModal = false">Cancel</button>
            <OutlinedButton variant="primary" :disabled="bulkProcessing" @click="bulkSubmit(); showBulkSubmitModal = false">Submit All</OutlinedButton>
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
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuoteLanguage } from '~/types'
import type { LanguageOption } from '~/stores/language'
import { formatRelativeTime, getDateTimestamp } from '~/utils/time-formatter'
import DeleteDraftDialog from '@/components/DeleteDraftDialog.vue'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { useErrorToast } from '~/composables/useErrorToast'

const { showErrorToast } = useErrorToast()
const { $t } = useI18n()

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
const draftCreatedSortOrder = ref<'ASC' | 'DESC'>('DESC')
const hasLoadedOnce = ref(false)
const searchQuery = ref('')
const selectedLanguage = ref({ label: $t('common.all_languages') as string, value: '' })
const currentPage = ref(1)
useSyncedPageQuery(currentPage)
const pageSize = ref(50)
const totalQuotes = ref(0)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showBulkEditDialog = ref(false)
const showBulkSubmitModal = ref(false)
const deleting = ref(false)
const bulkProcessing = ref(false)
const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

const bulkSelectionActions = computed(() => [
  { key: 'edit', label: 'Edit Selected', icon: 'i-tabler-edit' },
  { key: 'submit', label: 'Submit All', icon: 'i-tabler-send' },
  { key: 'delete', label: 'Delete All', icon: 'i-tabler-trash' },
])

const onBulkSelectionAction = (key: string) => {
  if (key === 'edit') showBulkEditDialog.value = true
  else if (key === 'submit') showBulkSubmitModal.value = true
  else if (key === 'delete') showBulkDeleteModal.value = true
}

const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed<AdminQuote[]>(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)

const languageStore = useLanguageStore()

const languageOptions = computed(() =>
  (languageStore.availableLanguages ?? []).map((lang: LanguageOption) => ({
    label: lang.display,
    value: lang.value === 'all' ? '' : lang.value
  }))
)

useSyncedQueryFilters({
  keys: ['q', 'lang', 'sort'],
  read: (query) => {
    const lang = readSyncedQueryValue(query.lang)
    return {
      q: readSyncedQueryValue(query.q),
      lang: languageOptions.value.some(option => option.value === lang) ? lang : '',
      sort: readSyncedQueryValue(query.sort) === 'oldest' ? 'oldest' : 'newest'
    }
  },
  write: (query, state) => ({
    ...query,
    q: state.q.trim() || undefined,
    lang: state.lang || undefined,
    sort: state.sort === 'newest' ? undefined : state.sort
  }),
  get: () => ({ q: searchQuery.value, lang: selectedLanguage.value.value, sort: draftCreatedSortOrder.value === 'ASC' ? 'oldest' : 'newest' }),
  apply: (state) => {
    searchQuery.value = state.q
    selectedLanguage.value = languageOptions.value.find(option => option.value === state.lang) ?? languageOptions.value[0]!
    draftCreatedSortOrder.value = state.sort === 'oldest' ? 'ASC' : 'DESC'
  },
  onFilterChange: () => { currentPage.value = 1 }
})

const inlineLanguageOptions = computed(() =>
  languageStore.availableLanguages
    .filter(lang => lang.value !== 'all')
    .map(lang => ({ label: lang.display, value: lang.value }))
)

const getLanguageOption = (lang: string | undefined) =>
  inlineLanguageOptions.value.find(opt => opt.value === lang) ?? null

const onLanguageChange = async (quote: AdminQuote, newLang: { label: string; value: string } | null) => {
  const newValue = newLang?.value
  if (!newValue || newValue === quote.language) return
  const previousLanguage = quote.language
  quote.language = newValue as QuoteLanguage
  try {
    await $fetch('/api/admin/quotes/bulk-edit', {
      method: 'POST',
      body: { quote_ids: [quote.id], language: newValue }
    })
  } catch (error) {
    quote.language = previousLanguage
    console.error('Failed to update language:', error)
    showErrorToast(error, 'Failed to update language')
  }
}

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
  return filtered
})

const uniqueContributors = computed(() => {
  const contributors = new Set(quotes.value.map(q => q.user_id).filter(Boolean))
  return contributors.size
})

const thisWeekCount = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return quotes.value.filter(q => getDateTimestamp(q.created_at) >= oneWeekAgo.getTime()).length
})

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
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      filteredQuotes.value.forEach(q => { newSelection[q.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null
  }
})

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSelection: Record<number, boolean> = {}
    filteredQuotes.value.forEach(q => { newSelection[q.id] = true })
    rowSelection.value = newSelection
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

const isAnyDialogOpen = computed(() =>
  showQuoteDialog.value || showDeleteModal.value || showBulkDeleteModal.value ||
  showBulkEditDialog.value || showEditQuoteDialog.value || showBulkSubmitModal.value
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
  isDropdownOpen: () => false,
  pagination: {
    currentPage: () => currentPage.value,
    totalPages: () => totalPages.value,
    setPage: page => { currentPage.value = page }
  }
})

const highlightedQuote = computed<AdminQuote | null>(() => {
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
  onSubmit: () => { showBulkSubmitModal.value = true },
  onDelete: () => { showBulkDeleteModal.value = true },
  onConfirmDialog: () => {
    if (showBulkDeleteModal.value) bulkDelete()
    else if (showBulkSubmitModal.value) { bulkSubmit(); showBulkSubmitModal.value = false }
    else if (showDeleteModal.value) deleteDraft()
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  onSingleSubmit: () => {
    if (highlightedQuote.value) submitForReview(highlightedQuote.value)
  },
  onSingleDelete: () => {
    if (highlightedQuote.value) confirmDelete(highlightedQuote.value)
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

const loadQuotes = async (page = currentPage.value) => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/quotes', {
      query: {
        status: 'draft',
        page,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        language: selectedLanguage.value.value || undefined,
        sort_by: 'created_at',
        sort_order: draftCreatedSortOrder.value
      }
    })

    quotes.value = (response?.data as any) || []
    totalQuotes.value = response?.pagination?.total || 0
    rowSelection.value = {}
    lastSelectedIndex.value = null
    clearHighlight()
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load draft quotes:', error)
    showErrorToast(error, { title: 'Error Loading Draft Quotes', fallback: 'Failed to load draft quotes. Please try again later.' })
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const toggleCreatedSort = () => {
  draftCreatedSortOrder.value = draftCreatedSortOrder.value === 'DESC' ? 'ASC' : 'DESC'
  if (currentPage.value !== 1) currentPage.value = 1
  else void loadQuotes(1)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = { label: 'All Languages', value: '' }
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes(1)
}

const getQuoteActions = (quote: AdminQuote) => [
  { label: $t('action_view') as string, leading: 'i-ph-eye', onclick: () => viewQuote(quote) },
  { label: $t('action_edit') as string, leading: 'i-ph-pencil', onclick: () => editQuote(quote) },
  { label: $t('action_submit') as string, leading: 'i-ph-paper-plane-tilt', onclick: () => submitForReview(quote) },
  {},
  { label: $t('action_delete') as string, leading: 'i-ph-trash', onclick: () => confirmDelete(quote) }
]

const showEditAuthorDialog = ref(false)
const authorToEdit = ref<Author | null>(null)
const showEditReferenceDialog = ref(false)
const referenceToEdit = ref<QuoteReference | null>(null)

const editAuthor = (author: Partial<Author>) => {
  authorToEdit.value = author as Author
  showEditAuthorDialog.value = true
}

const onAuthorUpdated = () => {
  showEditAuthorDialog.value = false
  authorToEdit.value = null
  loadQuotes(1)
}

const editReference = (reference: Partial<QuoteReference>) => {
  referenceToEdit.value = reference as QuoteReference
  showEditReferenceDialog.value = true
}

const onReferenceUpdated = () => {
  showEditReferenceDialog.value = false
  referenceToEdit.value = null
  loadQuotes(1)
}

const getAuthorActions = (quote: AdminQuote) => {
  const author = quote.author
  if (!author?.id) return []
  return [
    { label: $t('action_edit_author') as string, leading: 'i-ph-pencil', onclick: () => editAuthor(author) },
    { label: $t('action_view_author_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${author.id}`) }
  ]
}

const getReferenceActions = (quote: AdminQuote) => {
  const reference = quote.reference
  if (!reference?.id) return []
  return [
    { label: $t('action_edit_reference') as string, leading: 'i-ph-pencil', onclick: () => editReference(reference) },
    { label: $t('action_view_reference_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/references/${reference.id}`) }
  ]
}

const viewQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showQuoteDialog.value = true
}

const editQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const submitForReview = async (quote: AdminQuote) => {
  const previousHighlightedIndex = highlightedRowIndex.value
  try {
    await $fetch(`/api/admin/quotes/${quote.id}/submit`, { method: 'POST' } as any)
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
    repositionHighlightAfterRemoval(previousHighlightedIndex)
  } catch (error) {
    console.error('Failed to submit draft for review:', error)
    showErrorToast(error, { title: 'Submission Failed', fallback: 'Could not submit the draft. Please try again.' })
  }
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

const confirmDelete = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showDeleteModal.value = true
}

const deleteDraft = async () => {
  if (!selectedQuote.value) return
  const previousHighlightedIndex = highlightedRowIndex.value
  deleting.value = true
  try {
    await $fetch(`/api/quotes/${selectedQuote.value.id}`, { method: 'DELETE' } as any)
    quotes.value = quotes.value.filter(q => q.id !== selectedQuote.value?.id)
    showDeleteModal.value = false
    selectedQuote.value = null
    repositionHighlightAfterRemoval(previousHighlightedIndex)
  } catch (error) {
    console.error('Failed to delete draft:', error)
    showErrorToast(error, { title: 'Error Deleting Draft', fallback: 'Failed to delete the draft. Please try again.' })
  } finally {
    deleting.value = false
  }
}

const bulkDelete = async () => {
  if (selectedQuotes.value.length === 0) return
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
  } catch (error) {
    console.error('Failed to bulk delete:', error)
    showErrorToast(error, { title: 'Bulk Delete Failed', fallback: 'Please try again.' })
  } finally {
    bulkProcessing.value = false
  }
}

const bulkSubmit = async () => {
  if (selectedQuotes.value.length === 0) return
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    await $fetch('/api/admin/quotes/bulk-submit', {
      method: 'POST',
      body: { quote_ids: ids }
    } as any)
    quotes.value = quotes.value.filter(q => !ids.includes(q.id))
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk submit drafts:', error)
    showErrorToast(error, { title: 'Bulk Submit Failed', fallback: 'Please try again.' })
  } finally {
    bulkProcessing.value = false
  }
}

const onPageJump = (page: number) => {
  currentPage.value = page
}

watch(currentPage, () => { loadQuotes(currentPage.value) })

watchDebounced([searchQuery, selectedLanguage], () => {
  currentPage.value = 1
  loadQuotes(1)
}, { debounce: 300 })

onMounted(() => { loadQuotes() })

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  const mainEl = document.querySelector('main')
  if (!mainEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = mainEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const mainEl = document.querySelector('main')
  if (mainEl) footerObserver.observe(mainEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})
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
