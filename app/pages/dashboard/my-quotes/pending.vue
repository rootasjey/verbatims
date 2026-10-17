<template>
  <div>
    <ClientOnly>
      <Teleport to="#dashboard-page-toolbar">
    <div v-if="hasLoadedOnce && (totalQuotes > 0 || searchQuery.trim())" class="flex w-full justify-end">
      <div class="flex w-full gap-2 md:hidden">
        <input v-model="searchQuery" type="text" :aria-label="$t('search_placeholder') as string" :placeholder="$t('search_placeholder') as string" class="h-10 min-w-0 flex-1 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 font-sans text-sm text-gray-800 placeholder-[#77756f] focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:placeholder-gray-400" />
        <NButton icon btn="outline-gray" size="sm" label="i-ph-faders" class="h-10 w-10 shrink-0 rounded-md" :aria-label="$t('mobile.quote_filters.open_filters') as string" @click="mobileFiltersOpen = true" />
      </div>
      <div class="hidden items-center justify-end gap-2 md:flex">
        <Transition name="favourites-search">
          <input
            v-if="searchOpen || searchQuery.trim()"
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_placeholder') as string"
            :aria-label="$t('search_placeholder') as string"
            class="h-10 w-44 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 font-sans text-sm text-gray-800 placeholder-[#77756f] outline-none transition-[border-color,box-shadow] focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-gray-400 dark:focus:ring-white/10 sm:w-52"
            @keydown.esc="closeSearch"
          />
        </Transition>
        <NTooltip v-if="!searchOpen && !searchQuery.trim()" :content="$t('search_placeholder') as string" :_tooltip-content="{ side: 'bottom' }">
          <NButton icon btn="ghost-gray" size="sm" label="i-tabler-search" class="h-10 w-10 rounded-md border border-[#d2cfc6] bg-[#f0efe9] text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10" :aria-label="$t('search_placeholder') as string" @click="openSearch" />
        </NTooltip>
        <NTooltip v-else :content="$t('common.close') as string" :_tooltip-content="{ side: 'bottom' }">
          <NButton icon btn="ghost-gray" size="sm" label="i-tabler-x" class="h-10 w-10 rounded-md border border-[#d2cfc6] bg-[#f0efe9] text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10" :aria-label="$t('common.close') as string" @click="closeSearch" />
        </NTooltip>
        <NTooltip :content="String(sortBy?.label ?? '')" :_tooltip-content="{ side: 'bottom' }">
        <NCombobox
          class="my-quotes-sort"
          :model-value="sortOptions.find(o => o.value === sortValue) || sortOptions[0]"
          @update:model-value="(v: any) => { if (v) sortValue = v.value }"
          :items="sortOptions"
          by="value"
          :_combobox-list="{ class: 'min-w-[180px]' }"
          :_combobox-trigger="{
            btn: 'ghost-gray',
            size: 'sm',
            trailing: '',
            ariaLabel: String(sortBy?.label ?? ''),
            class: 'h-10 w-10 justify-center rounded-md border border-[#d2cfc6] bg-[#f0efe9] p-0 text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10',
          }"
        >
          <template #label="{ item }">
            <span class="flex min-w-0 items-center gap-2.5">
              <NIcon :name="item.leading" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
              <span>{{ item.label }}</span>
            </span>
          </template>
          <template #trigger="{ modelValue }">
            <NIcon :name="modelValue?.leading || 'i-tabler-arrows-sort'" class="h-5 w-5" />
            <span class="sr-only">{{ modelValue?.label }}</span>
          </template>
        </NCombobox>
        </NTooltip>
        <LanguageSelector :on-language-changed="onLanguageChanged" appearance="compact-toolbar" />
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
          class="relative py-4 first:pt-0 last:pb-0 transition-[padding,background-color] duration-200 ease-out motion-reduce:transition-none"
          :class="[idx < 8 ? 'animate-fade-in-up' : '', selectionMode ? 'px-2' : '', selectionMode && rowSelection[quote.id] ? 'rounded-md bg-black/[0.035] dark:bg-white/[0.05]' : '']"
          :style="idx < 8 ? { animationDelay: `${idx * 0.025}s` } : undefined"
          :data-dashboard-selection-row="selectionMode ? quote.id : undefined"
          :data-dashboard-quote-row="quote.id"
          :tabindex="selectionMode ? 0 : -1"
          @pointerdown="!selectionMode && longPress.start($event, quote)"
          @pointermove="!selectionMode && longPress.move($event)"
          @pointerup="longPress.end"
          @pointercancel="longPress.end"
          @contextmenu="selectionMode ? $event.preventDefault() : longPress.handleContextMenu($event, quote)"
          @click.capture="handleMobileRowClick($event, idx, quote.id)"
          @keydown.capture="handleRowKeydown($event, idx, quote.id)"
        >
          <div class="flex items-start gap-0 transition-[gap] duration-200 ease-out motion-reduce:transition-none" :class="selectionMode ? 'gap-3' : ''">
            <DashboardSelectionCheckbox
              :visible="selectionMode"
              :label="String($t('common.select_quote', { quote: quote.name }))"
              :model-value="!!rowSelection[quote.id]"
              @toggle="toggleQuote(idx, quote.id, $event.shiftKey)"
            />
            <NuxtLink :to="`/quotes/${quote.id}`" data-selection-primary class="quote-editorial-link flex-1 min-w-0 block" @click.prevent="!selectionMode && viewQuote(quote as unknown as DashboardQuote)">
              <QuoteEditorialText :text="quote.name" :tags="quote.tags" class="line-clamp-2 text-lg tracking-[-0.01em]" />
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span v-if="quote.author?.name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.author.name }}</span>
                <span v-if="!quote.author?.name && (quote as any).author_name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ (quote as any).author_name }}</span>
                <span v-if="(quote.author?.name || (quote as any).author_name) && (quote.reference?.name || (quote as any).reference_name)" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="quote.reference?.name" class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ quote.reference.name }}</span>
                <span v-if="!quote.reference?.name && (quote as any).reference_name" class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ (quote as any).reference_name }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <NTooltip v-if="formatDashboardQuoteDate(quote, 'pending')" :content="formatDashboardQuoteDateTooltip(quote, 'pending', locale || 'en') ?? ''">
                  <time class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ formatDashboardQuoteDateRelative(quote, 'pending', locale || 'en') }}</time>
                </NTooltip>
                  <span class="rounded-sm bg-gray-100 px-1.5 py-0.5 font-sans text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">{{ $t('common.status_pending') }}</span>
              </div>
            </NuxtLink>
            <div class="hidden md:block">
              <NDropdownMenu :items="getMobileActions(quote)" :modal="false">
                <button @click.stop class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10">
                  <NIcon name="i-ph-dots-three-vertical" class="h-4 w-4" />
                </button>
              </NDropdownMenu>
            </div>
            <button type="button" class="sr-only focus-visible:not-sr-only md:hidden" :aria-label="String($t('components.quote_actions.quick_actions'))" @click.stop="openMobileQuoteActions(quote)">
              <NIcon name="i-ph-dots-three-vertical" class="h-4 w-4" />
            </button>
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
        <div class="divide-y divide-[#d2cfc6]/80 dark:divide-white/10">
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
            <article
              class="quote-editorial-surface group relative grid grid-cols-[0px_minmax(0,1fr)_auto] items-center gap-y-4 gap-x-0 rounded-md px-2 py-5 transition-[grid-template-columns,gap,background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-black/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:hover:bg-white/[0.035]"
              :class="[index < 8 ? 'animate-fade-in-up' : '', selectionMode ? 'grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-x-4' : '', selectionMode && rowSelection[quote.id] ? 'bg-black/[0.035] dark:bg-white/[0.05]' : '']"
              :style="index < 8 ? { animationDelay: `${index * 0.025}s` } : undefined"
              :data-dashboard-selection-row="selectionMode ? quote.id : undefined"
              :data-dashboard-quote-row="quote.id"
              :tabindex="selectionMode ? 0 : -1"
              @click.capture="handleRowClickCapture($event, index, quote.id)"
              @keydown.capture="handleRowKeydown($event, index, quote.id)"
            >
              <DashboardSelectionCheckbox
                :visible="selectionMode"
                :label="String($t('common.select_quote', { quote: quote.name }))"
                :model-value="!!rowSelection[quote.id]"
                @toggle="toggleQuote(index, quote.id, $event.shiftKey)"
              />
              <div class="min-w-0">
                <QuoteEditorialText :text="quote.name" :tags="quote.tags" class="line-clamp-2 whitespace-normal break-words text-lg leading-snug" />
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
              <div data-selection-ignore class="ml-4 flex items-center gap-2 transition-[margin-left] duration-200 ease-out motion-reduce:transition-none" :class="selectionMode ? 'ml-0' : ''">
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
                <button @click.stop class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 opacity-100 transition-[opacity,background-color,color] duration-150 hover:bg-black/[0.06] hover:text-gray-900 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100">
                  <NIcon name="i-ph-dots-three-vertical" class="h-4 w-4" />
                </button>
              </NDropdownMenu>
              </div>
            </article>
          </ContextMenu>
        </div>

        <!-- Pagination -->
      <div v-if="totalPages > 1 || filteredQuotes.length > 0" class="h-20" />
      </div>
    </div>

    <div
      v-if="totalPages > 1 || (hasLoadedOnce && filteredQuotes.length > 0)"
      data-dashboard-pagination-bar
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
        :selection-mode="selectionMode"
        :selected-count="selectedQuotes.length"
        :visible-count="filteredQuotes.length"
        :actions="bulkSelectionActions"
        @toggle-visible="toggleSelectAllVisible"
        @clear="clearSelection"
        @exit-mode="exitSelectionMode"
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
    <ClientOnly>
      <DashboardMobileFiltersDrawer v-model:open="mobileFiltersOpen" v-model:sort-value="sortValue" :sort-options="sortOptions" show-language :on-language-changed="onLanguageChanged" />
    </ClientOnly>
    <ClientOnly>
      <DashboardQuoteActionsDrawer v-model:open="mobileActionsOpen" :quote-text="mobileActionQuote?.name" :actions="mobileActionItems" />
    </ClientOnly>
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
const searchOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const sortValue = ref('recent')
const mobileFiltersOpen = ref(false)
const mobileActionsOpen = ref(false)
const mobileActionQuote = ref<any | null>(null)
const mobileActionItems = computed(() => mobileActionQuote.value ? getMobileActions(mobileActionQuote.value) : [])
const openMobileQuoteActions = (quote: any) => {
  mobileActionQuote.value = quote
  mobileActionsOpen.value = true
}
const longPress = useDashboardLongPress(openMobileQuoteActions)
const currentPage = ref(1)
useSyncedPageQuery(currentPage)
const pageSize = ref(50)
const totalQuotes = ref(0)
const totalPages = ref(0)
const hasMore = ref(false)

const openSearch = async () => {
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

const closeSearch = () => {
  searchQuery.value = ''
  searchOpen.value = false
}

const sortOptions = computed(() => [
  { label: $t('common.most_recent'), value: 'recent', leading: 'i-tabler-clock-hour-12' },
  { label: $t('common.oldest_first'), value: 'oldest', leading: 'i-tabler-hourglass-empty' },
  { label: $t('common.author_az'), value: 'author', leading: 'i-tabler-abc' }
])

useSyncedQueryFilters({
  keys: ['q', 'sort'],
  read: (query) => {
    const sort = readSyncedQueryValue(query.sort)
    return {
      q: readSyncedQueryValue(query.q),
      sort: sortOptions.value.some(option => option.value === sort) ? sort : 'recent'
    }
  },
  write: (query, state) => ({
    ...query,
    q: state.q.trim() || undefined,
    sort: state.sort === 'recent' ? undefined : state.sort
  }),
  get: () => ({ q: searchQuery.value, sort: sortValue.value }),
  apply: (state) => {
    searchQuery.value = state.q
    sortValue.value = state.sort
  },
  onFilterChange: () => { currentPage.value = 1 }
})

const sortBy = computed(() => {
  const option = sortOptions.value.find(o => o.value === sortValue.value)
  return option || sortOptions.value[0]
})

const showQuoteDialog = ref(false)
const selectedDialogQuote = ref<AdminQuote | null>(null)
const withdrawingId = ref<number | null>(null)
const isAnyDialogOpen = computed(() => showQuoteDialog.value)

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

const selection = useDashboardQuoteSelection(filteredQuotes, {
  pagination: { currentPage, totalPages, loading }
})
const {
  selectionMode,
  rowSelection,
  selectedQuotes,
  clearSelection,
  exitSelectionMode,
  selectQuote,
  toggleQuote,
  selectAllVisible,
  toggleSelectAllVisible,
  handleRowClickCapture,
  handleRowKeydown
} = selection
watch(filteredQuotes, clearSelection)
const handleMobileRowClick = (event: MouseEvent, index: number, id: number) => {
  if (selectionMode.value) handleRowClickCapture(event, index, id)
  else longPress.suppressLongPressClick(event)
}
const selectQuoteForBulk = (quote: { id: number }) => {
  const index = filteredQuotes.value.findIndex(row => row.id === quote.id)
  if (index >= 0) selectQuote(index, quote.id)
}

const bulkSelectionActions = computed(() => [
  { key: 'withdraw', label: String($t('bulk_withdraw')), icon: 'i-tabler-arrow-back-up', disabled: bulkProcessing.value }
])
const onBulkSelectionAction = (key: string) => {
  if (key === 'withdraw') void bulkWithdraw()
}

useAdminKeyboardShortcuts({
  selectAllOnPage: selectAllVisible,
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isSelectionMode: () => selectionMode.value,
  onEscapeSelection: exitSelectionMode,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  customKeys: {
    w: () => bulkWithdraw()
  }
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
    if (page === 1) clearSelection()
    const response = await $fetch<{
      data: DashboardQuote[]
      pagination: { total: number; limit: number; totalPages: number; hasMore: boolean }
    }>('/api/dashboard/submissions', { query: queryParams })
    const data = response?.data || []
    quotes.value = data
    clearSelection()

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
    ...(!selectionMode.value ? [{
      label: $t('common.select_this_quote') as string,
      leading: 'i-tabler-checkbox',
      onclick: () => selectQuoteForBulk(quote)
    }, {}] : []),
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
    ...(!selectionMode.value ? [{
      label: $t('common.select_this_quote') as string,
      leading: 'i-tabler-checkbox',
      onclick: () => selectQuoteForBulk(quote)
    }, {}] : []),
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
    clearSelection()
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
  loadPendingQuotes(currentPage.value)
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
  const panelEl = document.querySelector('.dashboard-data-panel-shell')
  if (!panelEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = panelEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const panelEl = document.querySelector('.dashboard-data-panel-shell')
  if (panelEl) footerObserver.observe(panelEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})
</script>

<style scoped>
:global(.my-quotes-sort) {
  width: max-content;
}

:global(.my-quotes-sort [data-slot='combobox-anchor']),
:global(.my-quotes-sort [data-slot='combobox-trigger']) {
  width: 2.5rem !important;
  min-width: 2.5rem !important;
}

:global(.my-quotes-sort .combobox-trigger-trailing) {
  display: none !important;
}

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
  animation: fade-in-up 0.28s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up {
    animation: none;
  }
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
