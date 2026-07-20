<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Drafts
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalQuotes }} {{ totalQuotes === 1 ? 'draft' : 'drafts' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search quotes, authors, or users..."
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-56"
          />
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
              btn: 'ghost-gray',
              size: 'sm',
              trailing: '',
              class: 'gap-1 px-1.5 text-sm font-normal w-fit min-w-0',
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
          class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <NCombobox
          v-model="selectedLanguage"
          :items="languageOptions"
          by="value"
          :_combobox-list="{
            class: 'min-w-[200px]',
          }"
          :_combobox-trigger="{
            btn: 'ghost-gray',
            size: 'xs',
            trailing: '',
            class: 'gap-1 px-1 text-xs font-normal w-fit min-w-0',
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
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
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
      <!-- Bulk action bar -->
      <div v-if="selectedQuotes.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedQuotes.length }} selected</span>
        <OutlinedButton size="sm" @click="showBulkEditDialog = true">Edit Selected</OutlinedButton>
        <OutlinedButton size="sm" variant="primary" @click="showBulkSubmitModal = true">Submit All</OutlinedButton>
        <button
          class="font-sans text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors ml-auto"
          @click="showBulkDeleteModal = true"
        >
          Delete All
        </button>
        <button
          class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          @click="clearSelection"
        >
          Clear
        </button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left">
                <NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" />
              </th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quote</th>
              <th class="w-48 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Language</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
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
                <ContextMenu size="xs" native-on-modifier="ctrl" :items="getQuoteActions(quote)">
                  <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2 mb-1">
                    &ldquo;{{ quote.name }}&rdquo;
                  </blockquote>
                </ContextMenu>
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
                <span class="font-sans text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5">Draft</span>
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

      <div v-if="totalPages > 1" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1"
      class="fixed bottom-0 z-20 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-dashed border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-dotted decoration-gray-300 dark:decoration-gray-600"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }} &middot; {{ totalQuotes }} {{ totalQuotes === 1 ? 'draft' : 'drafts' }}
      </span>
      <div class="flex items-center gap-3">
        <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
        <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
        <button
          class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm px-2.5 py-1.5 transition-colors"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }} / {{ totalPages }}
        </button>
        <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
        <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
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
const hasLoadedOnce = ref(false)
const searchQuery = ref('')
const selectedLanguage = ref({ label: $t('common.all_languages') as string, value: '' })
const currentPage = ref(1)
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
  isDropdownOpen: () => false
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
        language: selectedLanguage.value.value || undefined
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
