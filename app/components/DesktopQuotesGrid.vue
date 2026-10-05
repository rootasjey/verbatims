<template>
  <div class="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-10">
    <ScrollableTags class="mb-2" />

    <!-- Sticky controls bar -->
    <div class="sticky top-14 z-3 bg-gray-50 dark:bg-[#0C0A09] py-3 mb-6">
      <div class="flex gap-3 items-center">
        <div class="quotes-search-control flex-1">
          <NInput
            ref="searchInput"
            :model-value="feed.searchQuery?.value"
            @update:model-value="val => (feed.searchQuery.value = val)"
            :placeholder="$t('desktop_quotes_grid.search_placeholder') as string"
            :aria-label="$t('desktop_quotes_grid.search_placeholder') as string"
            leading="i-ph-magnifying-glass"
            :trailing="feed.searchQuery?.value ? 'i-tabler-eraser' : undefined"
            size="md"
            :loading="feed.quotesLoading?.value"
            @trailing="feed.searchQuery.value = ''"
            :una="{
              inputTrailing: 'pointer-events-auto cursor-pointer'
            }"
          />
        </div>
        <div class="hidden md:block">
          <LanguageSelector :on-language-changed="feed.onLanguageChange" />
        </div>
        <div>
          <NTooltip :content="selectedSortOption?.label || ''" :_tooltip-content="{ side: 'bottom' }">
          <NCombobox
            class="quotes-sort"
            :model-value="selectedSortOption"
            @update:model-value="updateSort"
            :items="sortOptions"
            by="value"
            :_combobox-list="{ class: 'min-w-[180px]' }"
            :_combobox-trigger="{
              btn: 'soft-gray',
              size: 'sm',
              trailing: '',
              ariaLabel: selectedSortOption?.label || String($t('desktop_quotes_grid.sort_by')),
              class: 'h-10 w-10 justify-center rounded-md p-0',
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
        </div>
        <NTooltip
          :content="$t(feed.isAsc?.value ? 'desktop_quotes_grid.sort_order_ascending' : 'desktop_quotes_grid.sort_order_descending') as string"
          :_tooltip-content="{ side: 'bottom' }"
        >
          <NButton
            icon
            :label="feed.isAsc?.value ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
            :aria-label="$t(feed.isAsc?.value ? 'desktop_quotes_grid.sort_order_ascending' : 'desktop_quotes_grid.sort_order_descending') as string"
            btn="soft-gray"
            size="sm"
            @click="feed.isAsc.value = !feed.isAsc.value"
          />
        </NTooltip>
      </div>

      <div class="mt-2">
        <p
          role="status"
          aria-atomic="true"
          :aria-hidden="feed.initialLoading.value || feed.initialLoadError.value || feed.quotesLoading?.value"
          :style="{ visibility: feed.initialLoading.value || feed.initialLoadError.value || feed.quotesLoading?.value ? 'hidden' : 'visible' }"
          class="h-4 font-sans text-xs leading-4 text-gray-500 dark:text-gray-400"
        >
          {{ $t(feed.meta.value.total === 1 ? 'desktop_quotes_grid.results_count_one' : 'desktop_quotes_grid.results_count_other', { count: feed.meta.value.total }) }}
        </p>
      </div>
    </div>

    <div class="mt-12 mb-12 rounded-2xl bg-[#e7e4dd] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]">
      <div
        ref="quotesResultsShell"
        class="quotes-results-shell"
        :aria-busy="feed.initialLoading.value || feed.quotesLoading?.value"
        aria-live="polite"
      >
        <div ref="quotesResultsContent">
          <div v-if="showInitialSkeleton || showResultsSkeleton" class="space-y-8" role="status" :aria-label="$t('desktop_quotes_grid.loading_initial') as string" aria-busy="true">
            <div v-for="item in 6" :key="item" class="animate-pulse space-y-3">
              <div class="h-6 w-3/4 rounded bg-black/10 dark:bg-white/10" />
              <div class="h-4 w-40 rounded bg-black/8 dark:bg-white/8" />
            </div>
          </div>

          <div v-else-if="feed.initialLoadError.value" class="px-4 py-12 text-center sm:py-16" role="alert">
            <p class="font-serif text-3xl leading-tight text-gray-900 dark:text-gray-100">
              {{ $t('desktop_quotes_grid.initial_load_error') }}
            </p>
            <NButton btn="outline-gray" class="mt-6" @click="feed.refresh()">
              {{ $t('desktop_quotes_grid.retry') }}
            </NButton>
          </div>

          <QuotesEmptyView
            v-else-if="!feed.initialLoading.value && !feed.quotesLoading?.value && feed.quotes.value.length === 0"
            :search-query="feed.searchQuery?.value"
            :has-active-filters="hasActiveFilters"
            @clear-filters="$emit('clear-filters')"
            @open-submit-quote="showNewQuoteDialog = true"
          />

          <TransitionGroup
            v-else-if="feed.quotes.value.length > 0"
            name="quotes-list"
            tag="div"
            class="relative flex flex-col gap-10 sm:gap-12"
            appear
          >
            <QuoteTextEntry
              v-for="(q, index) in feed.quotes.value"
              :key="`${resultsAnimationKey}-${q.id}`"
              :quote="q"
              class="w-full"
              :style="{ '--quote-entry-delay': `${Math.min(index, 8) * 18}ms` }"
              @edit="openEdit"
              @delete="openDelete"
              @report="openReport"
            />
          </TransitionGroup>
        </div>
      </div>
    </div>

    <div v-if="feed.hasMore?.value" class="flex justify-center">
      <LoadMoreButton
        class="mb-4"
        :idleText="$t('desktop_quotes_grid.load_more') as string"
        :loadingText="$t('desktop_quotes_grid.loading') as string"
        :isLoading="feed.quotesLoading?.value"
        @load="feed.loadMore()"
      />
    </div>

    <AddQuoteDialog v-model="showNewQuoteDialog" @quote-added="feed.refresh()" />
    <AddQuoteDialog v-model="showEditQuoteDialog" :edit-quote="selectedQuote as any"
      @quote-updated="closeEditAfterUpdate" />

    <DeleteQuoteDialog v-model="showDeleteQuoteDialog" :quote="selectedQuote as any" @quote-deleted="onQuoteDeleted" />

    <ReportDialog v-model="showReportDialog" targetType="quote" :targetId="selectedQuote?.id" />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types';

const { $t } = useI18n()

const props = defineProps<{
  feed: UseQuoteSearchFeed
  sortOptions: { label: string; value: string; leading?: string }[]
  showInitialSkeleton: boolean
  showResultsSkeleton: boolean
  resultsAnimationKey: number
  hasActiveFilters: boolean
}>()

defineEmits<{
  (event: 'clear-filters'): void
}>()

const selectedQuote = ref<ProcessedQuoteResult | null>(null)
const showNewQuoteDialog = ref(false)
const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showReportDialog = ref(false)
const quotesResultsShell = ref<HTMLElement | null>(null)
const quotesResultsContent = ref<HTMLElement | null>(null)
const RESULTS_TRANSITION = 360
let resultsHeightTimer: ReturnType<typeof setTimeout> | undefined
let resultsHeightFrame: number | undefined

const selectedSortOption = computed(() =>
  props.sortOptions.find(option => option.value === props.feed.selectedSortBy.value.value)
  ?? props.sortOptions[0]
)

const updateSort = (option: { label: string; value: string }) => {
  if (option?.value) props.feed.selectedSortBy.value = option
}

const openEdit = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const openDelete = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showDeleteQuoteDialog.value = true
}

const openReport = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showReportDialog.value = true
}

const searchInput = ref<any>(null)

const focus = () => {
  const inputComponent = searchInput.value

  if (typeof inputComponent?.focus === 'function') {
    inputComponent.focus()
    return
  }

  const inputElement = inputComponent?.$el?.querySelector?.('input')
  if (inputElement instanceof HTMLElement) {
    inputElement.focus()
  }
}

const typeCharacter = (key: string) => {
  props.feed.searchQuery.value = `${props.feed.searchQuery.value || ''}${key}`
  nextTick(() => {
    focus()
  })
}

defineExpose({ focus, typeCharacter })

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

watch(() => props.feed.quotesLoading.value, (isLoading, wasLoading) => {
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

watch(() => props.feed.initialLoading.value, (isLoading, wasLoading) => {
  if (!isLoading && wasLoading) void animateResultsHeight()
}, { flush: 'post' })

watch(() => props.feed.quotes.value.length, () => {
  if (!props.feed.initialLoading.value && !props.feed.quotesLoading.value) {
    void animateResultsHeight()
  }
}, { flush: 'post' })

const closeEditAfterUpdate = async () => {
  showEditQuoteDialog.value = false

  try {
    if (!selectedQuote.value?.id) return
    const res = await $fetch<{ success: boolean; data: ProcessedQuoteResult }>(`/api/quotes/${selectedQuote.value.id}`)
    const updated = res.data
    if (updated) props.feed.updateQuoteInFeed(updated)
  } catch (e) { console.error('Failed to update quote:', e) }
}

const onQuoteDeleted = async () => {
  showDeleteQuoteDialog.value = false
  if (selectedQuote.value?.id) {
    props.feed.removeQuoteFromFeed(selectedQuote.value.id)
  }
}
</script>

<style scoped>
.quotes-results-shell {
  display: grid;
  grid-template-rows: auto;
  overflow: clip;
  transition: grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.quotes-results-shell > :first-child {
  min-height: 0;
}

.quotes-search-control :deep(.input:focus) {
  box-shadow: 0 0 0 1px #78716c, 0 1px 2px rgb(0 0 0 / 5%) !important;
}

:global(.quotes-sort) {
  width: max-content;
}

:global(.quotes-sort [data-slot='combobox-anchor']),
:global(.quotes-sort [data-slot='combobox-trigger']) {
  width: 2.5rem !important;
  min-width: 2.5rem !important;
}

:global(.quotes-sort .combobox-trigger-trailing) {
  display: none !important;
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
