<template>
  <div>
    <ClientOnly>
      <Teleport to="#dashboard-page-toolbar">
    <div v-if="hasLoadedOnce && (totalQuotes > 0 || searchQuery.trim())" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400">
        {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? String($t('common.status_pending')).toLowerCase() + ' ' + $t('common.quote_singular') : String($t('common.status_pending')).toLowerCase() + ' ' + $t('common.quote_plural') }}
      </p>
      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('search_placeholder') as string"
          class="h-10 w-full rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 font-sans text-sm text-gray-800 placeholder-[#77756f] focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-gray-400 dark:focus:ring-white/10 sm:w-52"
        />
        <NCombobox
          :model-value="sortOptions.find(o => o.value === sortValue) || sortOptions[0]"
          @update:model-value="(v: any) => { if (v) sortValue = v.value }"
          :items="sortOptions"
          by="value"
          :_combobox-list="{ class: 'min-w-[180px]' }"
          :_combobox-trigger="{
            btn: 'ghost-gray',
            size: 'sm',
            trailing: 'i-ph-caret-down',
            class: 'h-10 w-full justify-between gap-2 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 text-sm font-medium text-gray-800 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10 sm:w-auto',
          }"
        >
          <template #trigger="{ modelValue }">
            <span class="whitespace-nowrap text-sm font-medium leading-none">{{ modelValue?.label }}</span>
          </template>
        </NCombobox>
        <div class="hidden md:block">
          <LanguageSelector :on-language-changed="onLanguageChanged" compact />
        </div>
      </div>
    </div>
      </Teleport>
    </ClientOnly>
    <div :aria-busy="loading">
    <!-- Loading (first load) -->
    <div v-if="showInitialSkeleton && !hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Keep the empty state and its animated copy out of filter refreshes. -->
    <div v-else-if="hasLoadedOnce && loading && quotes.length === 0" aria-hidden="true" class="flex min-h-[320px] flex-col items-center justify-center py-16 text-center">
      <div class="h-8 w-64 max-w-full animate-pulse rounded-sm bg-gray-200/70 dark:bg-gray-700/70" />
      <div class="mt-4 h-4 w-96 max-w-full animate-pulse rounded-sm bg-gray-200/60 dark:bg-gray-700/60" />
      <div class="mt-7 h-10 w-44 animate-pulse rounded-sm bg-gray-200/70 dark:bg-gray-700/70" />
    </div>

    <!-- Empty -->
    <div v-else-if="hasLoadedOnce && !loading && filteredQuotes.length === 0" class="py-16 text-center">
      <DashboardEmptyStateCopy
        :heading="emptyStateHeading"
        :description="emptyStateDescription"
        :interactive-phrase="!searchQuery && languageStore.currentLanguageValue !== 'all' ? String($t('common.all_languages')) : undefined"
      >
        <template #description-action>
          <DashboardEmptyStateLanguageAction :on-language-changed="onLanguageChanged" />
        </template>
      </DashboardEmptyStateCopy>
      <div v-if="!searchQuery" class="mt-7 flex flex-wrap items-center justify-center gap-3">
        <NButton
          to="/dashboard/my-quotes/drafts"
          btn="solid-black"
          trailing="i-ph-arrow-right"
          class="min-h-10 justify-center gap-2 rounded-1 bg-gray-900 px-4 font-sans text-sm font-600 text-gray-50 transition-[transform,background-color] duration-150 hover:bg-gray-700 active:scale-96 motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus-visible:ring-gray-400 dark:focus-visible:ring-offset-[#17191e]"
        >
          {{ pageT('empty_action') }}
        </NButton>
      </div>
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
            <NuxtLink :to="`/quotes/${quote.id}`" class="flex-1 min-w-0 block" @click.prevent="viewQuote(quote as unknown as DashboardQuote)">
              <ContextMenu size="xs" native-on-modifier="ctrl" :items="getQuoteActions(quote)">
                <blockquote class="line-clamp-2 font-serif text-lg leading-relaxed tracking-[-0.01em] text-gray-900 dark:text-gray-100">
                  {{ quote.name }}
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
                <NTooltip v-if="formatDashboardQuoteDate(quote, 'pending')" :content="formatDashboardQuoteDateTooltip(quote, 'pending', locale || 'en') ?? ''">
                  <time class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ formatDashboardQuoteDateRelative(quote, 'pending', locale || 'en') }}</time>
                </NTooltip>
                  <span class="rounded-sm bg-gray-100 px-1.5 py-0.5 font-sans text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">{{ $t('common.status_pending') }}</span>
              </div>
            </NuxtLink>
            <NDropdownMenu :items="getMobileActions(quote)" :modal="false">
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
            class="font-sans text-xs text-amber-600 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-800 px-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors rounded-sm"
            @click="bulkWithdraw"
          >
            {{ $t('bulk_withdraw') }}
          </button>
          <button
            class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto"
            @click="clearSelection"
          >
            {{ $t('common.clear') }}
          </button>
        </div>

        <div class="divide-y divide-[#d2cfc6]/80 dark:divide-white/10">
          <div class="flex items-center gap-4 border-b border-[#d2cfc6]/80 pb-3 dark:border-white/10">
            <NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" />
            <span class="font-sans text-xs font-medium text-gray-500 dark:text-gray-400">{{ $t('col_quote') }}</span>
          </div>
          <ContextMenu
            v-for="(quote, index) in filteredQuotes"
            :key="quote.id"
            size="xs"
            native-on-modifier="ctrl"
            trigger-as="div"
            wrapper-class="w-full"
            ignore-interactive-targets
            :items="getQuoteActions(quote)"
          >
            <article class="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-md px-2 py-5 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.035]">
              <div :class="selectedQuotes.length > 0 ? 'opacity-100' : 'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none'">
                <NCheckbox checkbox="gray" :model-value="!!rowSelection[quote.id]" @click="handleRowCheckboxClick($event, index, quote.id)" />
              </div>
              <div class="min-w-0">
                <blockquote class="line-clamp-2 whitespace-normal break-words font-serif text-lg leading-snug text-gray-900 dark:text-gray-100">
                  {{ quote.name }}
                </blockquote>
                <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm text-gray-600 dark:text-gray-400">
                  <ContextMenu v-if="quote.author?.name" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                    <span>{{ quote.author.name }}</span>
                  </ContextMenu>
                  <span v-if="quote.author?.name && quote.reference?.name" aria-hidden="true" class="text-gray-400 dark:text-gray-600">·</span>
                  <ContextMenu v-if="quote.reference?.name" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                    <span>{{ quote.reference.name }}</span>
                  </ContextMenu>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{ $t('common.status_pending') }}</span>
                  <NTooltip v-if="formatDashboardQuoteDate(quote, 'pending')" :content="formatDashboardQuoteDateTooltip(quote, 'pending', locale || 'en') ?? ''">
                    <time>{{ formatDashboardQuoteDateRelative(quote, 'pending', locale || 'en') }}</time>
                  </NTooltip>
                </div>
              </div>
              <div class="flex items-center gap-2">
              <NCombobox
                :model-value="getLanguageOption(quote.language)"
                @update:model-value="onLanguageChange(quote, $event)"
                :items="inlineLanguageOptions"
                by="value"
                :_combobox-input="{ placeholder: 'Search language...', class: 'text-xs' }"
                :_combobox-list="{ class: 'min-w-[100px]' }"
                :_combobox-trigger="{ btn: 'ghost-gray', size: 'xs', trailing: '', class: 'gap-1 px-1 text-xs font-normal w-full min-w-0 h-auto justify-start text-gray-500 dark:text-gray-400' }"
              >
                <template #trigger="{ modelValue }">{{ modelValue?.label || quote.language }}</template>
              </NCombobox>
              <NDropdownMenu :items="getQuoteActions(quote)" :modal="false">
                <button @click.stop class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/[0.06] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100">
                  <NIcon name="i-ph-dots-three-vertical" class="h-4 w-4" />
                </button>
              </NDropdownMenu>
              </div>
            </article>
          </ContextMenu>
        </div>

        <!-- Pagination -->
      <div v-if="totalPages > 1" class="h-20" />
      </div>
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
        of {{ totalPages }}
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

    <!-- Quote details dialog -->
    <ClientOnly>
      <AdminQuoteDetailDialog
        :quote="selectedDialogQuote"
        v-model:open="showQuoteDialog"
      />
    </ClientOnly>

    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~/types'
import {
  formatDashboardQuoteDate,
  formatDashboardQuoteDateRelative,
  formatDashboardQuoteDateTooltip,
  getDashboardQuoteDateTimestamp,
} from '~/utils/dashboard-quote-date'

interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { $t } = useI18n()
const { locale } = useI18nLocale()
const pageT = useI18n().$_t({ ...useRoute() })

useHead({
  title: $t('meta_title') as string
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const languageStore = useLanguageStore()
const emptyStateHeading = computed(() => {
  if (searchQuery.value) return String(pageT('empty_search_title'))
  if (languageStore.currentLanguageValue !== 'all') {
    const language = String($t(`content_language.${languageStore.currentLanguageValue}`))
    return String(pageT('empty_language_title')).replace('{language}', language)
  }
  return String(pageT('empty_title'))
})
const emptyStateDescription = computed(() => {
  if (searchQuery.value) return String(pageT('empty_search_desc'))
  if (languageStore.currentLanguageValue !== 'all') return String(pageT('empty_language_desc'))
  return String(pageT('empty_desc'))
})

const inlineLanguageOptions = computed(() =>
  languageStore.availableLanguages
    .filter(lang => lang.value !== 'all')
    .map(lang => ({ label: lang.display, value: lang.value }))
)

const getLanguageOption = (lang: string | undefined) =>
  inlineLanguageOptions.value.find(opt => opt.value === lang) ?? null

const onLanguageChange = async (quote: any, newLang: { label: string; value: string } | null) => {
  const newValue = newLang?.value
  if (!newValue || newValue === quote.language) return
  const previousLanguage = quote.language
  quote.language = newValue
  try {
    await $fetch('/api/admin/quotes/bulk-edit', {
      method: 'POST',
      body: { quote_ids: [quote.id], language: newValue }
    })
  } catch (error) {
    quote.language = previousLanguage
    console.error('Failed to update language:', error)
  }
}

const { showErrorToast } = useErrorToast()

const loading = ref(true)
const loadingMore = ref(false)
const hasLoadedOnce = ref(false)
const showInitialSkeleton = ref(false)
let initialSkeletonTimer: ReturnType<typeof setTimeout> | undefined
const bulkProcessing = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortValue = ref('recent')
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
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

const showQuoteDialog = ref(false)
const selectedDialogQuote = ref<AdminQuote | null>(null)
const withdrawingId = ref<number | null>(null)
const lastSelectedIndex = ref<number | null>(null)
const rowSelection = ref<Record<string, boolean>>({})
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

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

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const isAnyDialogOpen = computed(() => showQuoteDialog.value)

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

useAdminKeyboardShortcuts({
  selectAllOnPage: () => {
    if (allSelectedOnPage.value) rowSelection.value = {}
    else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
  },
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  customKeys: {
    w: () => bulkWithdraw()
  }
})

const filteredQuotes = computed(() => {
  const list = [...quotes.value]
  switch (sortBy.value?.value) {
    case 'oldest':
      list.sort((a, b) => getDashboardQuoteDateTimestamp(a, 'pending') - getDashboardQuoteDateTimestamp(b, 'pending'))
      break
    case 'author':
      list.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default:
      list.sort((a, b) => getDashboardQuoteDateTimestamp(b, 'pending') - getDashboardQuoteDateTimestamp(a, 'pending'))
  }
  return list
})

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return filteredQuotes.value.map((q: any) => ({
    ...q,
    result_type: 'quote',
    author_name: q.author_name ?? q.author?.name,
    author_is_fictional: q.author_is_fictional ?? q.author?.is_fictional,
    author_image_url: q.author_image_url ?? q.author?.image_url,
    reference_name: q.reference_name ?? q.reference?.name,
    reference_type: q.reference_type ?? q.reference?.type,
    tags: q.tags ?? [],
    author: q.author,
    reference: q.reference,
  }))
})

const loadPendingQuotes = async (page = 1) => {
  try {
    if (page === 1) loading.value = true
    if (page > 1) loadingMore.value = true
    const queryParams: any = { page, limit: pageSize.value, status: 'pending' }
    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }
    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }
    if (page === 1) rowSelection.value = {}
    const response = await $fetch<{
      data: DashboardQuote[]
      pagination: { total: number; limit: number; totalPages: number; hasMore: boolean }
    }>('/api/dashboard/submissions', { query: queryParams })
    const data = response?.data || []
    quotes.value = data
    rowSelection.value = {}

    totalQuotes.value = response.pagination?.total || 0
    pageSize.value = response.pagination?.limit || pageSize.value
    totalPages.value = response.pagination?.totalPages || Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || pageSize.value))
    currentPage.value = page
    hasMore.value = response?.pagination?.hasMore ?? (currentPage.value < totalPages.value)
  } catch (error) {
    console.error('Failed to load pending quotes:', error)
  } finally {
    if (initialSkeletonTimer) clearTimeout(initialSkeletonTimer)
    showInitialSkeleton.value = false
    loading.value = false
    loadingMore.value = false
    hasLoadedOnce.value = true
  }
}

const getQuoteEntityActions = (quote: any) => [
  ...(quote.author?.id ? [{
    label: $t('action_view_author_page') as string,
    leading: 'i-ph-user',
    onclick: () => navigateTo(`/authors/${quote.author.id}`)
  }] : []),
  ...(quote.reference?.id ? [{
    label: $t('action_view_reference_page') as string,
    leading: 'i-ph-book-open-text',
    onclick: () => navigateTo(`/references/${quote.reference.id}`)
  }] : [])
]

const getQuoteActions = (quote: any) => {
  const entityActions = getQuoteEntityActions(quote)

  return [
    {
      label: $t('action_view') as string,
      leading: 'i-ph-eye',
      onclick: () => viewQuote(quote)
    },
    ...entityActions,
    ...(entityActions.length ? [{}] : []),
    {
      label: $t('action_withdraw') as string,
      leading: 'i-ph-arrow-counter-clockwise',
      disabled: withdrawingId.value === quote.id,
      onclick: () => withdrawQuote(quote)
    }
  ]
}

const getMobileActions = (quote: any) => {
  const entityActions = getQuoteEntityActions(quote)

  return [
    ...entityActions,
    ...(entityActions.length ? [{}] : []),
    {
      label: $t('action_view') as string,
      leading: 'i-ph-eye',
      onclick: () => viewQuote(quote)
    },
    {},
    {
      label: $t('action_withdraw') as string,
      leading: 'i-ph-arrow-counter-clockwise',
      disabled: withdrawingId.value === quote.id,
      onclick: () => withdrawQuote(quote)
    }
  ]
}

const getAuthorActions = (quote: any) => {
  const author = quote.author
  const authorId = author?.id
  if (!author?.name || !authorId) return []
  return [
    { label: $t('action_view_author_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${authorId}`) },
    { label: $t('action_share') as string, leading: 'i-ph-share', onclick: () => shareAuthor(authorId) }
  ]
}

const getReferenceActions = (quote: any) => {
  const reference = quote.reference
  const referenceId = reference?.id
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

const viewQuote = (quote: DashboardQuote) => {
  selectedDialogQuote.value = quote as unknown as AdminQuote
  showQuoteDialog.value = true
}

const withdrawQuote = async (quote: DashboardQuote) => {
  try {
    withdrawingId.value = quote.id
    await $fetch(`/api/quotes/${quote.id}/withdraw`, { method: 'POST' } as any)
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (error) {
    console.error('Failed to withdraw quote:', error)
    showErrorToast(error, $t('error_withdraw') as string)
  } finally {
    withdrawingId.value = null
  }
}

const bulkWithdraw = async () => {
  if (selectedQuotes.value.length === 0) return
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    await $fetch('/api/quotes/withdraw', {
      method: 'POST',
      body: { ids }
    })

    quotes.value = quotes.value.filter(q => !ids.includes(q.id))
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk withdraw:', error)
    showErrorToast(error, $t('error_bulk_withdraw') as string)
  } finally {
    bulkProcessing.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortValue.value = 'recent'
  sortValue.value = 'recent'
  currentPage.value = 1
  loadPendingQuotes(1)
}

const onLanguageChanged = async () => {
  currentPage.value = 1
  loadPendingQuotes(1)
}

watch(currentPage, () => {
  loadPendingQuotes(currentPage.value)
})

watchDebounced([searchQuery, sortBy], () => {
  currentPage.value = 1
  loadPendingQuotes(1)
}, { debounce: 300 })

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  currentPage.value++
  loadPendingQuotes(currentPage.value)
}

onMounted(() => {
  initialSkeletonTimer = setTimeout(() => {
    if (!hasLoadedOnce.value && loading.value) showInitialSkeleton.value = true
  }, 250)
  loadPendingQuotes()
})

onBeforeUnmount(() => {
  if (initialSkeletonTimer) clearTimeout(initialSkeletonTimer)
})

const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

const onPageJump = (page: number) => {
  currentPage.value = page
}

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
