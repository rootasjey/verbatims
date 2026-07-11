<template>
  <div>
    <!-- Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? String($t('common.status_draft')).toLowerCase() : String($t('common.status_draft')).toLowerCase() + 's' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_placeholder') as string"
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
          :placeholder="$t('search_placeholder') as string"
          class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
      </div>

      <NAlert
        v-if="submissionRestrictionMessage"
        alert="soft-amber"
        :title="submissionRestrictionMessage as string"
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
        {{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? $t('empty_search_desc') : $t('empty_desc') }}
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
              <ContextMenu size="xs" native-on-modifier="ctrl" :items="getQuoteActions(quote)">
                <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed line-clamp-2">
                  &ldquo;{{ quote.name }}&rdquo;
                </blockquote>
              </ContextMenu>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <ContextMenu v-if="quote.author?.name" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                  <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.author.name }}</span>
                </ContextMenu>
                <span v-if="!quote.author?.name && (quote as any).author_name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ (quote as any).author_name }}</span>
                <span v-if="(quote.author?.name || (quote as any).author_name) && (quote.reference?.name || (quote as any).reference_name)" class="text-gray-300 dark:text-gray-600">·</span>
                <ContextMenu v-if="quote.reference?.name" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                  <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ quote.reference.name }}</span>
                </ContextMenu>
                <span v-if="!quote.reference?.name && (quote as any).reference_name" class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ (quote as any).reference_name }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ formatDate((quote as any).createdAt || quote.created_at) }}</span>
                <span class="font-sans text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">{{ $t('common.status_draft') }}</span>
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
            {{ loadingMore ? $t('common.loading') : $t('common.load_more') }}
          </button>
        </div>
      </div>

      <!-- Desktop: Table -->
      <div class="hidden md:block">
        <!-- Bulk action bar -->
        <div v-if="selectedQuotes.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
          <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('common.selected_count', { count: selectedQuotes.length }) }}</span>
          <button
            v-if="canSubmitForReview"
            class="font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            @click="bulkSubmit"
          >
            {{ $t('bulk_submit') }}
          </button>
          <button
            class="font-sans text-xs text-red-600 dark:text-red-400 border border-dashed border-red-300 dark:border-red-800 px-3 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-sm"
            @click="showBulkDeleteModal = true"
          >
            {{ $t('bulk_delete') }}
          </button>
          <button
            class="font-sans text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            @click="showBulkEditDialog = true"
          >
            {{ $t('bulk_edit') }}
          </button>
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
                  <div>
                    <NCheckbox
                      checkbox="gray"
                      :model-value="allSelected"
                      @update:model-value="toggleAllSelection"
                    />
                  </div>
                </th>
                <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_quote') }}</th>
                <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_lang') }}</th>
                <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_tags') }}</th>
                <th class="w-16 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_status') }}</th>
                <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_created') }}</th>
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
                    <ContextMenu size="xs" native-on-modifier="ctrl" :items="getQuoteActions(quote)">
                      <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-normal break-words mb-1 line-clamp-2">
                        {{ quote.name }}
                      </blockquote>
                    </ContextMenu>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <ContextMenu v-if="quote.author?.name" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                        <span>{{ quote.author.name }}</span>
                      </ContextMenu>
                      <span v-if="quote.author?.name && quote.reference?.name">·</span>
                      <ContextMenu v-if="quote.reference?.name" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                        <span>{{ quote.reference.name }}</span>
                      </ContextMenu>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 align-top">
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ quote.language || $t('common.na') }}</span>
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
                  <span class="font-sans text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">{{ $t('common.status_draft') }}</span>
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
            {{ $t('common.page_of', { n: currentPage, m: totalPages }) }}
          </span>
          <div class="flex items-center gap-3">
            <button
              v-if="currentPage > 1"
              class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5"
              @click="currentPage = Math.max(1, currentPage - 1)"
            >
              &larr; {{ $t('common.previous') }}
            </button>
            <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.first_page') }}</span>
            <button
              v-if="currentPage < totalPages"
              class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            >
              {{ $t('common.next') }} &rarr;
            </button>
            <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.last_page') }}</span>
          </div>
        </div>
        <div v-else class="pt-4 text-center">
          <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.no_more_pages') }}</span>
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

const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string
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
const sortValue = ref('recent')
const currentPage = ref(1)
const pageSize = ref(50)
const totalDrafts = ref(0)
const totalPages = ref(0)
const hasMore = ref(false)

const sortOptions = computed(() => [
  { label: $t('common.most_recent'), value: 'recent' },
  { label: $t('common.oldest_first'), value: 'oldest' },
  { label: $t('common.author_az'), value: 'author' }
])

const sortBy = computed(() => {
  const option = sortOptions.value.find(o => o.value === sortValue.value)
  return option || sortOptions.value[0]
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
  if (!user.value.email_verified) return $t('restriction_email')
  return $t('restriction_age')
})

const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const filteredQuotes = computed(() => {
  const list = [...quotes.value]
  switch (sortBy.value?.value) {
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

const getQuoteActions = (quote: any) => [
  {
    label: $t('action_edit') as string,
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {},
  {
    label: $t('action_submit') as string,
    leading: 'i-ph-paper-plane-tilt',
    disabled: !canSubmitForReview.value,
    onclick: () => submitQuote(quote)
  },
  {},
  {
    label: $t('action_delete') as string,
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(quote)
  }
]

const getMobileActions = (quote: any) => [
  {
    label: $t('action_edit') as string,
    leading: 'i-ph-pencil',
    onclick: () => handleEditQuote(quote)
  },
  {},
  {
    label: $t('action_submit') as string,
    leading: 'i-ph-paper-plane-tilt',
    disabled: !canSubmitForReview.value,
    onclick: () => handleSubmitQuote(quote)
  },
  {},
  {
    label: $t('action_delete') as string,
    leading: 'i-ph-trash',
    onclick: () => handleDeleteQuote(quote)
  }
]

const getAuthorActions = (quote: any) => {
  const author = quote.author
  const authorId = author?.id || quote.authorId
  if (!author?.name || !authorId) return []
  return [
    { label: $t('action_view_author_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${authorId}`) },
    { label: $t('action_share') as string, leading: 'i-ph-share', onclick: () => shareAuthor(authorId) }
  ]
}

const getReferenceActions = (quote: any) => {
  const reference = quote.reference
  const referenceId = reference?.id || quote.referenceId
  if (!reference?.name || !referenceId) return []
  return [
    { label: $t('action_view_reference_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/references/${referenceId}`) },
    { label: $t('action_share') as string, leading: 'i-ph-share', onclick: () => shareReference(referenceId) }
  ]
}

const shareAuthor = (authorId: number) => {
  const url = `${window.location.origin}/authors/${authorId}`
  navigator.clipboard.writeText(url)
  useToast().toast({ title: $t('action_share') as string, description: $t('common.copied_to_clipboard') as string, toast: 'outline-success' })
}

const shareReference = (referenceId: number) => {
  const url = `${window.location.origin}/references/${referenceId}`
  navigator.clipboard.writeText(url)
  useToast().toast({ title: $t('action_share') as string, description: $t('common.copied_to_clipboard') as string, toast: 'outline-success' })
}

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
      title: $t('toast_submit_unavailable') as string,
      description: submissionRestrictionMessage.value as string,
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
      title: $t('toast_submit_unavailable') as string,
      description: submissionRestrictionMessage.value as string
    })
    return
  }
  try {
    await $fetch(`/api/quotes/${quote.id}/submit`, { method: 'POST' })
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (error: any) {
    console.error('Failed to submit quote:', error)
    showErrorToast(error, $t('error_submit') as string)
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
      title: $t('toast_submit_unavailable') as string,
      description: submissionRestrictionMessage.value as string,
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
    showErrorToast(error, $t('error_bulk_submit') as string)
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
    showErrorToast(error, $t('error_bulk_delete') as string)
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
      label: $t('header_edit') as string,
      leading: 'i-ph-pencil',
      shortcut: 'E',
      onclick: () => { showBulkEditDialog.value = true }
    })
    actions.push({
      label: $t('header_submit') as string,
      leading: 'i-ph-paper-plane-tilt',
      shortcut: 'S',
      disabled: !canSubmitForReview.value,
      onclick: () => bulkSubmit()
    })
    actions.push({
      label: $t('header_delete') as string,
      leading: 'i-ph-trash',
      shortcut: 'D',
      onclick: () => { showBulkDeleteModal.value = true }
    })
  }
  if (actions.length > 0) actions.push({})
  actions.push({
    label: $t('header_refresh') as string,
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadDrafts(currentPage.value)
  })
  actions.push({
    label: $t('header_reset') as string,
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
