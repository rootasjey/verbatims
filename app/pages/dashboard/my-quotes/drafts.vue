<template>
  <div>
    <!-- Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Drafts
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'draft' : 'drafts' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search drafts..."
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 w-48"
          />
          <select
            v-model="sortValue"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <LanguageSelector :on-language-changed="onLanguageChanged" :use-classic-design="true" />
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search drafts..."
          class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
      </div>

      <NAlert
        v-if="submissionRestrictionMessage"
        alert="soft-amber"
        :title="submissionRestrictionMessage"
        class="mt-4"
      />
    </div>

    <!-- Loading (first load) -->
    <div v-if="!hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? 'No matching drafts' : 'No drafts yet' }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Start writing your first quote draft.' }}
      </p>
    </div>

    <!-- Results -->
    <div v-else-if="hasLoadedOnce">
      <!-- Mobile: Feed -->
      <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="(quote, idx) in processedMobileQuotes"
          :key="quote.id"
          class="py-4 first:pt-0 last:pb-0 animate-fade-in-up"
          :style="{ animationDelay: `${idx * 0.05}s` }"
        >
          <div class="flex items-start gap-3">
            <NuxtLink :to="`/quotes/${quote.id}`" class="flex-1 min-w-0 block" @click.prevent="handleEditQuote(quote)">
              <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed line-clamp-2">
                &ldquo;{{ quote.name }}&rdquo;
              </blockquote>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.author?.name || (quote as any).author_name || 'Unknown' }}</span>
                <span v-if="quote.reference?.name || (quote as any).reference_name" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="quote.reference?.name || (quote as any).reference_name" class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ quote.reference?.name || (quote as any).reference_name }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ formatDate((quote as any).createdAt || quote.created_at) }}</span>
                <span class="font-sans text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">Draft</span>
              </div>
            </NuxtLink>
            <NDropdownMenu :items="getMobileActions(quote)">
              <button
                @click.stop
                class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 -mt-1"
              >
                <NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" />
              </button>
            </NDropdownMenu>
          </div>
        </div>
        <div v-if="hasMore" class="pt-5 pb-2 text-center">
          <button
            :disabled="loadingMore"
            class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5 disabled:opacity-50"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>

      <!-- Desktop: Table -->
      <div class="hidden md:block">
        <!-- Bulk action bar -->
        <div v-if="selectedQuotes.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
          <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedQuotes.length }} selected</span>
          <button
            v-if="canSubmitForReview"
            class="font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            @click="bulkSubmit"
          >
            Submit Selected
          </button>
          <button
            class="font-sans text-xs text-red-600 dark:text-red-400 border border-dashed border-red-300 dark:border-red-800 px-3 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-sm"
            @click="showBulkDeleteModal = true"
          >
            Delete Selected
          </button>
          <button
            class="font-sans text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            @click="showBulkEditDialog = true"
          >
            Edit Selected
          </button>
          <button
            class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto"
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
                  <div>
                    <NCheckbox
                      checkbox="gray"
                      :model-value="allSelected"
                      @update:model-value="toggleAllSelection"
                    />
                  </div>
                </th>
                <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quote</th>
                <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Lang</th>
                <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Tags</th>
                <th class="w-16 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
                <th class="w-10 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dashed divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="quote in filteredQuotes"
                :key="quote.id"
                class="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-3 py-3 align-top">
                  <div :class="selectedQuotes.length > 0 ? '' : 'opacity-0 group-hover:opacity-100'">
                    <NCheckbox
                      checkbox="gray"
                      :model-value="!!rowSelection[quote.id]"
                      @click="handleRowCheckboxClick($event, filteredQuotes.indexOf(quote), quote.id)"
                    />
                  </div>
                </td>
                <td class="px-3 py-3 align-top">
                  <div class="max-w-md">
                    <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-normal break-words mb-1 line-clamp-2">
                      {{ quote.name }}
                    </blockquote>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span v-if="quote.author?.name">{{ quote.author.name }}</span>
                      <span v-if="quote.author?.name && quote.reference?.name">·</span>
                      <span v-if="quote.reference?.name">{{ quote.reference.name }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 align-top">
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ quote.language || 'N/A' }}</span>
                </td>
                <td class="px-3 py-3 align-top">
                  <div v-if="quote.tags?.length" class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in quote.tags.slice(0, 2)"
                      :key="tag.id"
                      class="font-sans text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5"
                    >
                      {{ tag.name }}
                    </span>
                    <span
                      v-if="quote.tags.length > 2"
                      class="font-sans text-xs text-gray-400 dark:text-gray-500 px-1"
                      :title="quote.tags.slice(2).map(t => t.name).join(', ')"
                    >
                      +{{ quote.tags.length - 2 }}
                    </span>
                  </div>
                  <span v-else class="font-sans text-sm text-gray-400">&mdash;</span>
                </td>
                <td class="px-3 py-3 align-top">
                  <span class="font-sans text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">Draft</span>
                </td>
                <td class="px-3 py-3 align-top">
                  <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatDate((quote as any).createdAt || quote.created_at) }}</span>
                </td>
                <td class="px-3 py-3 align-top">
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
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <div class="flex items-center gap-3">
            <button
              v-if="currentPage > 1"
              class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5"
              @click="currentPage = Math.max(1, currentPage - 1)"
            >
              &larr; Previous
            </button>
            <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
            <button
              v-if="currentPage < totalPages"
              class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            >
              Next &rarr;
            </button>
            <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
          </div>
        </div>
        <div v-else class="pt-4 text-center">
          <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">No more pages to show</span>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <ClientOnly>
      <DeleteDraftDialog
        v-model:open="showDeleteModal"
        :deleting="deleting"
        @delete-draft="deleteDraft"
      />
    </ClientOnly>

    <ClientOnly>
      <DeleteQuoteInBulkDialog
        v-model:open="showBulkDeleteModal"
        :deleting="bulkProcessing"
        :selected-quotes="selectedQuotesData"
        @bulk-delete="bulkDelete"
      />
    </ClientOnly>

    <ClientOnly>
      <BulkEditQuotesDialog
        v-model:open="showBulkEditDialog"
        :selected-quotes="selectedQuotesData"
        @updated="onBulkEditComplete"
      />
    </ClientOnly>

    <ClientOnly>
      <AddQuoteDialog
        v-model="showEditQuoteDialog"
        :edit-quote="selectedQuote"
        @quote-updated="onQuoteUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <EditQuoteDrawer
        v-model:open="showEditQuoteDrawer"
        :edit-quote="selectedQuote"
        @submitted="onQuoteUpdated"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types';
import { formatDate, getDateTimestamp } from '~/utils/time-formatter'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Drafts - Dashboard - Verbatims'
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const { user } = useUserSession()
const { showErrorToast } = useErrorToast()

const languageStore = useLanguageStore()

const loading = ref(true)
const loadingMore = ref(false)
const hasLoadedOnce = ref(false)
const bulkProcessing = ref(false)
const deleting = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const sortValue = ref('recent')
const currentPage = ref(1)
const pageSize = ref(50)
const totalDrafts = ref(0)
const totalPages = ref(0)
const hasMore = ref(false)

watch(sortValue, (val) => {
  const option = sortOptions.find(o => o.value === val)
  if (option) sortBy.value = option
})

const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showBulkEditDialog = ref(false)
const showEditQuoteDialog = ref(false)
const showEditQuoteDrawer = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)
const rowSelection = ref<Record<string, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed<DashboardQuote[]>(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)

const canSubmitForReview = computed(() => {
  if (!user.value) return true
  if (user.value.role !== 'user') return true
  if (!user.value.email_verified) return false

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const createdAtMs = new Date(user.value.created_at || '').getTime()
  if (!Number.isFinite(createdAtMs)) return false

  return Date.now() - createdAtMs >= ONE_WEEK_MS
})

const submissionRestrictionMessage = computed(() => {
  if (canSubmitForReview.value) return ''
  if (!user.value || user.value.role !== 'user') return ''
  if (!user.value.email_verified) return 'Verify your email before submitting drafts for review.'
  return 'Your account must be at least 7 days old before submitting drafts for review.'
})

const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Author A-Z', value: 'author' }
]

const filteredQuotes = computed(() => {
  const list = [...quotes.value]
  switch (sortBy.value.value) {
    case 'oldest':
      list.sort((a, b) => getDateTimestamp((a as any).createdAt || a.created_at) - getDateTimestamp((b as any).createdAt || b.created_at))
      break
    case 'author':
      list.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default:
      list.sort((a, b) => getDateTimestamp((b as any).createdAt || b.created_at) - getDateTimestamp((a as any).createdAt || a.created_at))
  }
  return list
})

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return filteredQuotes.value.map((q) => ({
    ...q,
    result_type: 'quote',
    author_name: (q as any).author_name ?? q.author?.name,
    author_is_fictional: (q as any).author_is_fictional ?? (q.author as any)?.is_fictional,
    author_image_url: (q as any).author_image_url ?? (q.author as any)?.image_url,
    reference_name: (q as any).reference_name ?? q.reference?.name,
    reference_type: (q as any).reference_type ?? (q.reference as any)?.type,
    tags: (q as any).tags ?? [],
    author: q.author || ((q as any).author_name ? { id: q.author_id!, name: (q as any).author_name, is_fictional: (q as any).author_is_fictional, image_url: (q as any).author_image_url } as any : undefined),
    reference: q.reference || ((q as any).reference_name ? { id: q.reference_id!, name: (q as any).reference_name, type: (q as any).reference_type } as any : undefined),
  }))
})

const loadDrafts = async (page = 1) => {
  try {
    if (page === 1) loading.value = true
    if (page > 1) loadingMore.value = true
    const queryParams: any = { page, limit: pageSize.value, status: 'draft' }

    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }

    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }

    const response = await $fetch<{
      data: DashboardQuote[]
      pagination: { total: number; limit: number; totalPages: number; hasMore: boolean }
    }>('/api/dashboard/submissions', { query: queryParams })

    const data = response?.data || []
    quotes.value = data
    rowSelection.value = {}
    lastSelectedIndex.value = null

    totalDrafts.value = response.pagination?.total || 0
    pageSize.value = response.pagination?.limit || pageSize.value
    totalPages.value = response.pagination?.totalPages || Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || pageSize.value))
    currentPage.value = page
    hasMore.value = response?.pagination?.hasMore ?? (currentPage.value < totalPages.value)
  } catch (error) {
    console.error('Failed to load drafts:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    hasLoadedOnce.value = true
  }
}

watch(currentPage, () => {
  loadDrafts(currentPage.value)
})

watchDebounced([searchQuery, sortBy], () => {
  currentPage.value = 1
  loadDrafts(1)
}, { debounce: 300 })

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {},
  {
    label: 'Submit for Review',
    leading: 'i-ph-paper-plane-tilt',
    disabled: !canSubmitForReview.value,
    onclick: () => submitQuote(quote)
  },
  {},
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(quote)
  }
]

const getMobileActions = (quote: any) => [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => handleEditQuote(quote)
  },
  {},
  {
    label: 'Submit for Review',
    leading: 'i-ph-paper-plane-tilt',
    disabled: !canSubmitForReview.value,
    onclick: () => handleSubmitQuote(quote)
  },
  {},
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => handleDeleteQuote(quote)
  }
]

const editQuote = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  showEditQuoteDrawer.value = false
  selectedQuote.value = null
  loadDrafts()
}

const onBulkEditComplete = () => {
  showBulkEditDialog.value = false
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadDrafts()
}

const handleEditQuote = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote as unknown as DashboardQuote
  showEditQuoteDrawer.value = true
}

const handleSubmitQuote = async (quote: ProcessedQuoteResult) => {
  if (!canSubmitForReview.value) {
    useToast().toast({
      title: 'Submission unavailable',
      description: submissionRestrictionMessage.value,
      toast: 'outline-warning'
    })
    return
  }
  await submitQuote(quote as unknown as DashboardQuote)
}

const handleDeleteQuote = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote as unknown as DashboardQuote
  showDeleteModal.value = true
}

const submitQuote = async (quote: DashboardQuote) => {
  if (!canSubmitForReview.value) {
    useToast().toast({
      title: 'Submission unavailable',
      description: submissionRestrictionMessage.value
    })
    return
  }
  try {
    await $fetch(`/api/quotes/${quote.id}/submit`, { method: 'POST' })
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (error: any) {
    console.error('Failed to submit quote:', error)
    showErrorToast(error, 'Failed to submit quote')
  }
}

const confirmDelete = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showDeleteModal.value = true
}

const deleteDraft = async () => {
  if (!selectedQuote.value) return

  deleting.value = true
  try {
    await $fetch(`/api/quotes/${selectedQuote.value.id}`, { method: 'DELETE' } as any)
    quotes.value = quotes.value.filter(q => q.id !== selectedQuote.value?.id)
    showDeleteModal.value = false
    selectedQuote.value = null
  } catch (error) {
    console.error('Failed to delete draft:', error)
  } finally {
    deleting.value = false
  }
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const isAnyDialogOpen = computed(() =>
  showDeleteModal.value || showBulkDeleteModal.value ||
  showBulkEditDialog.value || showEditQuoteDialog.value || showEditQuoteDrawer.value
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

const bulkSubmit = async () => {
  if (selectedQuotes.value.length === 0) return
  if (!canSubmitForReview.value) {
    useToast().toast({
      title: 'Submission unavailable',
      description: submissionRestrictionMessage.value,
      toast: 'outline-warning'
    })
    return
  }
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    const batchSize = 5
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await Promise.all(batch.map(id => $fetch(`/api/quotes/${id}/submit`, { method: 'POST' } as any)))
    }

    quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk submit:', error)
    showErrorToast(error, 'Bulk submit failed')
  } finally {
    bulkProcessing.value = false
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
    showErrorToast(error, 'Bulk delete failed')
  } finally {
    bulkProcessing.value = false
  }
}

useAdminKeyboardShortcuts({
  selectAllOnPage: () => {
    if (allSelectedOnPage.value) rowSelection.value = {}
    else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
  },
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onEdit: () => { showBulkEditDialog.value = true },
  onSubmit: () => bulkSubmit(),
  onDelete: () => { showBulkDeleteModal.value = true },
  onConfirmDialog: () => {
    if (showBulkDeleteModal.value) bulkDelete()
    else if (showDeleteModal.value) deleteDraft()
  }
})

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value.value = 'recent'
  sortValue.value = 'recent'
  currentPage.value = 1
  loadDrafts(1)
}

const onLanguageChanged = async () => {
  await loadDrafts(1)
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  currentPage.value++
  loadDrafts(currentPage.value)
}

const headerActions = computed(() => {
  const actions: any[] = []
  if (selectedQuotes.value.length > 0) {
    actions.push({
      label: 'Edit Selected',
      leading: 'i-ph-pencil',
      shortcut: 'E',
      onclick: () => { showBulkEditDialog.value = true }
    })
    actions.push({
      label: 'Submit Selected',
      leading: 'i-ph-paper-plane-tilt',
      shortcut: 'S',
      disabled: !canSubmitForReview.value,
      onclick: () => bulkSubmit()
    })
    actions.push({
      label: 'Delete Selected',
      leading: 'i-ph-trash',
      shortcut: 'D',
      onclick: () => { showBulkDeleteModal.value = true }
    })
  }
  if (actions.length > 0) actions.push({})
  actions.push({
    label: 'Refresh',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadDrafts(currentPage.value)
  })
  actions.push({
    label: 'Reset Filters',
    leading: 'i-ph-x',
    onclick: () => resetFilters()
  })
  return actions
})

onMounted(() => {
  loadDrafts()
})
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
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
