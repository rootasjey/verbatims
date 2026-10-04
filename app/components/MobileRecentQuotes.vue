<template>
  <div class="px-4 py-4">
    <ScrollableTags class="mb-4" />

    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <div class="quotes-search-control min-w-0 flex-1">
          <NInput
            :model-value="feed.searchQuery.value"
            @update:model-value="value => (feed.searchQuery.value = value)"
            :placeholder="$t('desktop_quotes_grid.search_placeholder') as string"
            :aria-label="$t('desktop_quotes_grid.search_placeholder') as string"
            leading="i-ph-magnifying-glass"
            :trailing="feed.searchQuery.value ? 'i-tabler-eraser' : undefined"
            size="md"
            :loading="feed.quotesLoading.value"
            @trailing="feed.searchQuery.value = ''"
            :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
          />
        </div>
        <div class="relative shrink-0">
          <NButton
            icon
            label="i-ph-faders"
            size="sm"
            btn="outline-gray"
            class="min-h-9 min-w-9"
            :aria-label="$t(hasActiveMobileFilters ? 'mobile.quote_filters.open_filters_active' : 'mobile.quote_filters.open_filters') as string"
            :aria-expanded="filtersOpen"
            aria-haspopup="dialog"
            @click="filtersOpen = true"
          />
          <span
            v-if="hasActiveMobileFilters"
            aria-hidden="true"
            class="pointer-events-none absolute -right-[2px] -top-[2px] h-2 w-2 rounded-full bg-stone-500 ring-2 ring-[#fafaf9] dark:bg-stone-300 dark:ring-[#0c0a09]"
          />
        </div>
      </div>

      <p
        role="status"
        aria-atomic="true"
        :aria-hidden="!showResultCount"
        :style="{ visibility: showResultCount ? 'visible' : 'hidden' }"
        class="h-4 font-sans text-xs leading-4 text-gray-500 dark:text-gray-400"
      >
        {{ $t(feed.meta.value.total === 1 ? 'desktop_quotes_grid.results_count_one' : 'desktop_quotes_grid.results_count_other', { count: feed.meta.value.total }) }}
      </p>
    </div>

    <div class="mt-5 rounded-2xl bg-[#e7e4dd] px-3 py-4 dark:bg-[#17191e]">
      <div
        ref="quotesResultsShell"
        class="quotes-results-shell"
        :aria-busy="feed.initialLoading.value || feed.quotesLoading.value"
        aria-live="polite"
      >
        <div ref="quotesResultsContent">
          <div v-if="showInitialSkeleton || showResultsSkeleton" class="space-y-6" role="status" :aria-label="$t('desktop_quotes_grid.loading_initial') as string" aria-busy="true">
            <div v-for="item in 5" :key="item" class="animate-pulse space-y-2">
              <div class="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
              <div class="h-4 w-2/3 rounded bg-black/8 dark:bg-white/8" />
              <div class="h-3 w-28 rounded bg-black/6 dark:bg-white/6" />
            </div>
          </div>

          <div v-else-if="feed.initialLoadError.value" class="px-2 py-12 text-center" role="alert">
            <p class="font-serif text-2xl leading-tight text-gray-900 dark:text-gray-100">
              {{ $t('desktop_quotes_grid.initial_load_error') }}
            </p>
            <NButton btn="outline-gray" class="mt-5" @click="feed.refresh()">
              {{ $t('desktop_quotes_grid.retry') }}
            </NButton>
          </div>

          <QuotesEmptyView
            v-else-if="!feed.initialLoading.value && !feed.quotesLoading.value && feed.quotes.value.length === 0"
            :search-query="feed.searchQuery.value"
            :has-active-filters="hasActiveFilters"
            @clear-filters="$emit('clear-filters')"
            @open-submit-quote="$emit('add-quote')"
          />

          <TransitionGroup
            v-else-if="feed.quotes.value.length > 0"
            name="quotes-list"
            tag="div"
            class="relative space-y-2"
            appear
          >
            <div
              v-for="(quote, index) in visibleQuotes"
              :key="`${resultsAnimationKey}-${quote.id}`"
              class="quote-editorial-surface rounded-xl px-2 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/6"
              :style="{ '--quote-entry-delay': `${Math.min(index, 8) * 18}ms` }"
              @pointerdown="longPress.start($event, quote)"
              @pointermove="longPress.move($event)"
              @pointerup="longPress.end"
              @pointercancel="longPress.end"
              @contextmenu="longPress.handleContextMenu($event, quote)"
              @click.capture="longPress.suppressLongPressClick"
            >
              <div class="mb-1 flex min-w-0 items-center gap-2 font-sans text-xs">
                <NuxtLink
                  v-if="quote.author"
                  :to="`/authors/${quote.author.id}`"
                  class="max-w-[45%] shrink-0 truncate font-500 text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
                >
                  {{ quote.author.name }}
                </NuxtLink>
                <span v-else class="max-w-[45%] shrink-0 truncate font-500 text-gray-700 dark:text-gray-300">
                  {{ $t('home.unknown_author') }}
                </span>
                <span v-if="quote.reference" class="shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true">·</span>
                <NuxtLink
                  v-if="quote.reference"
                  :to="`/references/${quote.reference.id}`"
                  class="min-w-0 truncate text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {{ quote.reference.name }}
                </NuxtLink>
              </div>

              <NuxtLink :to="`/quotes/${quote.id}`" class="quote-editorial-link block group">
                <QuoteEditorialText :text="truncateQuote(quote.name, 120)" class="text-lg text-gray-900 dark:text-gray-100" />
              </NuxtLink>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <div v-if="feed.hasMore.value" class="mt-6 flex justify-center">
      <LoadMoreButton
        :isLoading="feed.loadingMore.value"
        :idleText="$t('desktop_quotes_grid.load_more') as string"
        :loadingText="$t('desktop_quotes_grid.loading') as string"
        @load="feed.loadMore"
      />
    </div>

    <ClientOnly>
      <MobileQuoteFilters
        v-model:open="filtersOpen"
        :sort-by="feed.selectedSortBy.value.value"
        :sort-order="feed.isAsc.value ? 'ASC' : 'DESC'"
        :sort-options="sortOptions"
        :has-active-filters="hasActiveMobileFilters"
        @update:sort-by="updateSort"
        @toggle-sort-order="feed.isAsc.value = !feed.isAsc.value"
        @language-changed="feed.onLanguageChange"
        @reset-filters="resetMobileFilters"
      />
    </ClientOnly>

    <ClientOnly>
      <DashboardQuoteActionsDrawer
        v-model:open="mobileActionsOpen"
        :quote-text="mobileActionQuote?.name"
        :actions="mobileActionItems"
      />
      <ReportDialog v-model="showReportDialog" targetType="quote" :targetId="mobileActionQuote?.id" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'

const { $t } = useI18n()

const props = defineProps<{
  feed: UseQuoteSearchFeed
  sortOptions: { label: string; value: string }[]
  showInitialSkeleton: boolean
  showResultsSkeleton: boolean
  resultsAnimationKey: number
  hasActiveFilters: boolean
}>()
const { feed, sortOptions } = toRefs(props)
const languageStore = useLanguageStore()
const mobileActionsOpen = ref(false)
const mobileActionQuote = ref<ProcessedQuoteResult | null>(null)
const showReportDialog = ref(false)
const longPress = useDashboardLongPress<ProcessedQuoteResult>(openMobileQuoteActions)
const { showErrorToast } = useErrorToast()

defineEmits<{
  (event: 'add-quote'): void
  (event: 'clear-filters'): void
}>()

const filtersOpen = ref(false)
const quotesResultsShell = ref<HTMLElement | null>(null)
const quotesResultsContent = ref<HTMLElement | null>(null)
const RESULTS_TRANSITION = 360
let resultsHeightTimer: ReturnType<typeof setTimeout> | undefined
let resultsHeightFrame: number | undefined
const showResultCount = computed(() =>
  !feed.value.initialLoading.value &&
  !feed.value.initialLoadError.value &&
  !feed.value.quotesLoading.value
)
const hasActiveMobileFilters = computed(() =>
  languageStore.currentLanguageValue !== 'all' ||
  feed.value.selectedSortBy.value.value !== 'created_at' ||
  feed.value.isAsc.value
)
const visibleQuotes = computed(() => feed.value.quotes.value)
const mobileActionItems = computed(() => {
  const quote = mobileActionQuote.value
  if (!quote) return []

  const actions: Array<{ label?: string | null; leading?: string; onclick?: () => void }> = [
    ...(quote.author?.id ? [{ label: String($t('components.quote_actions.view_author_page')), leading: 'i-ph-user', onclick: () => navigateTo(`/authors/${quote.author!.id}`) }] : []),
    ...(quote.reference?.id ? [{ label: String($t('components.quote_actions.view_reference_page')), leading: 'i-ph-book-open-text', onclick: () => navigateTo(`/references/${quote.reference!.id}`) }] : []),
  ]
  if (actions.length) actions.push({})
  actions.push(
    { label: String($t('components.quote_actions.copy_link')), leading: 'i-ph-link', onclick: () => copyQuoteLink(quote) },
    { label: String($t('components.quote_actions.copy_text')), leading: 'i-ph-quotes', onclick: () => copyQuoteText(quote) },
    { label: String($t('components.quote_actions.share')), leading: 'i-ph-share-network', onclick: () => shareQuote(quote) },
    { label: String($t('components.quote_actions.report')), leading: 'i-ph-flag', onclick: () => { mobileActionQuote.value = quote; showReportDialog.value = true } }
  )
  return actions
})

function openMobileQuoteActions(quote: ProcessedQuoteResult) {
  mobileActionQuote.value = quote
  mobileActionsOpen.value = true
}

async function copyQuoteLink(quote: ProcessedQuoteResult) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/quotes/${quote.id}`)
    useToast().toast({ title: String($t('components.quote_actions.link_copied')), toast: 'outline-success' })
  } catch {
    showErrorToast(null, { title: String($t('components.quote_actions.copy_failed')), fallback: String($t('components.quote_actions.copy_link_failed')) })
  }
}

async function copyQuoteText(quote: ProcessedQuoteResult) {
  try {
    const attribution = [quote.author?.name, quote.reference?.name].filter(Boolean).join(' · ')
    await navigator.clipboard.writeText(`“${quote.name}”${attribution ? ` — ${attribution}` : ''}`)
    useToast().toast({ title: String($t('components.quote_actions.text_copied')), toast: 'outline-success' })
  } catch {
    showErrorToast(null, { title: String($t('components.quote_actions.copy_failed')), fallback: String($t('components.quote_actions.clipboard_unavailable')) })
  }
}

async function shareQuote(quote: ProcessedQuoteResult) {
  const shareData = {
    title: String($t('components.quote_actions.share_title')),
    text: `“${quote.name}”${quote.author?.name ? ` — ${quote.author.name}` : ''}`,
    url: `${window.location.origin}/quotes/${quote.id}`
  }
  try {
    if (navigator.share) await navigator.share(shareData)
    else await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    showErrorToast(error, { title: String($t('components.quote_actions.share_failed')), fallback: String($t('components.quote_actions.try_again')) })
  }
}

const updateSort = (value: string) => {
  const option = sortOptions.value.find(item => item.value === value)
  if (option) feed.value.selectedSortBy.value = option
}

const resetMobileFilters = async () => {
  const recentSort = sortOptions.value.find(option => option.value === 'created_at') ?? sortOptions.value[0]
  if (recentSort) feed.value.selectedSortBy.value = recentSort
  feed.value.isAsc.value = false
  await languageStore.resetToDefault()
}

const freezeResultsHeight = () => {
  const shell = quotesResultsShell.value
  if (!shell) return

  if (resultsHeightFrame !== undefined && typeof window !== 'undefined') {
    window.cancelAnimationFrame(resultsHeightFrame)
    resultsHeightFrame = undefined
  }
  if (resultsHeightTimer) {
    clearTimeout(resultsHeightTimer)
    resultsHeightTimer = undefined
  }

  const currentHeight = shell.getBoundingClientRect().height
  if (currentHeight > 0) shell.style.gridTemplateRows = `${currentHeight}px`
}

const animateResultsHeight = async () => {
  await nextTick()

  const shell = quotesResultsShell.value
  if (!shell) return

  const fromHeight = shell.getBoundingClientRect().height
  shell.style.gridTemplateRows = 'auto'
  const targetHeight = quotesResultsContent.value?.scrollHeight ?? shell.scrollHeight

  if (Math.abs(fromHeight - targetHeight) < 1) {
    shell.style.gridTemplateRows = 'auto'
    return
  }

  shell.style.gridTemplateRows = `${fromHeight}px`
  if (typeof window === 'undefined') {
    shell.style.gridTemplateRows = 'auto'
    return
  }

  resultsHeightFrame = window.requestAnimationFrame(() => {
    resultsHeightFrame = undefined
    if (quotesResultsShell.value) quotesResultsShell.value.style.gridTemplateRows = `${targetHeight}px`
  })
  resultsHeightTimer = setTimeout(() => {
    if (quotesResultsShell.value) quotesResultsShell.value.style.gridTemplateRows = 'auto'
    resultsHeightTimer = undefined
  }, RESULTS_TRANSITION)
}

watch(() => feed.value.quotesLoading.value, (isLoading, wasLoading) => {
  if (isLoading && !wasLoading) {
    freezeResultsHeight()
  }
})

watch(() => props.showResultsSkeleton, (showSkeleton) => {
  if (showSkeleton) freezeResultsHeight()
})

watch(() => props.resultsAnimationKey, () => {
  void animateResultsHeight()
}, { flush: 'post' })

watch(() => feed.value.initialLoading.value, (isLoading, wasLoading) => {
  if (!isLoading && wasLoading) void animateResultsHeight()
}, { flush: 'post' })

watch(() => feed.value.quotes.value.length, () => {
  if (!feed.value.initialLoading.value && !feed.value.quotesLoading.value) {
    void animateResultsHeight()
  }
}, { flush: 'post' })

const truncateQuote = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}
</script>

<style scoped>
.quotes-results-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  overflow: clip;
  transition: grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.quotes-results-shell > :first-child {
  min-width: 0;
  min-height: 0;
}

.quotes-search-control :deep(.input:focus) {
  box-shadow: 0 0 0 1px #78716c, 0 1px 2px rgb(0 0 0 / 5%) !important;
}

:deep(.quotes-list-enter-active) {
  transition: opacity 260ms ease, transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--quote-entry-delay, 0ms);
}

:deep(.quotes-list-leave-active) {
  position: absolute;
  width: 100%;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
}

:deep(.quotes-list-move) {
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

:deep(.quotes-list-enter-from),
:deep(.quotes-list-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .quotes-results-shell {
    transition-duration: 1ms;
  }

  :deep(.quotes-list-enter-active),
  :deep(.quotes-list-leave-active),
  :deep(.quotes-list-move) {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }
}
</style>
