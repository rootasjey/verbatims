<template>
  <div class="max-w-4xl mx-auto px-8 pb-16">
    <!-- Sticky controls bar -->
    <div v-if="feed.quotesLoading?.value || feed.quotes.value.length > 0 || feed.searchQuery?.value" class="sticky top-14 z-3 bg-gray-50 dark:bg-[#0C0A09] py-3 mb-6">
      <div class="flex gap-3 items-center">
        <div class="hidden md:block">
          <LanguageSelector @language-changed="feed.onLanguageChange" />
        </div>
        <div class="flex-1">
          <NInput
            ref="searchInput"
            :model-value="feed.searchQuery?.value"
            @update:model-value="val => (feed.searchQuery.value = val)"
            :placeholder="$t('desktop_quotes_grid.search_placeholder') as string"
            leading="i-ph-magnifying-glass"
            :trailing="feed.searchQuery?.value ? 'i-ph-x' : undefined"
            size="md"
            :loading="feed.quotesLoading?.value"
            @trailing="feed.searchQuery.value = ''; feed.searchQuery.value = ''"
            :una="{
              inputTrailing: 'pointer-events-auto cursor-pointer'
            }"
          />
        </div>
        <div>
          <NSelect
            :model-value="feed.selectedSortBy?.value"
            @update:model-value="(val) => { feed.selectedSortBy.value = val }"
            :items="feed.sortByOptions"
            :placeholder="$t('desktop_quotes_grid.sort_by') as string"
            size="sm"
            item-key="label"
            value-key="label"
            select="outline-gray"
          />
        </div>
        <NButton
          icon
          :label="feed.isAsc?.value ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          size="sm"
          @click="feed.isAsc.value = !feed.isAsc.value"
        />
      </div>
    </div>

    <ScrollableTags class="mb-2" />

    <template v-if="feed.quotes.value.length > 0">
      <div class="flex flex-wrap gap-2 mt-16 mb-12">
        <QuoteTextEntry
          v-for="q in feed.quotes.value"
          :key="q.id"
          :quote="q"
          @edit="openEdit"
          @delete="openDelete"
          @report="openReport"
        />
      </div>
    </template>

    <div v-else-if="!feed.quotesLoading?.value" class="px-8 py-24 sm:py-32">
      <div class="max-w-xl mx-auto text-center">
        <p v-if="feed.searchQuery?.value" class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
          {{ $t('desktop_quotes_grid.no_quotes_match') }}
        </p>
        <p v-else class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
          {{ $t('desktop_quotes_grid.no_quotes_yet') }}
        </p>

        <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
          <template v-if="feed.searchQuery?.value">
            {{ $t('desktop_quotes_grid.no_results_for', { query: feed.searchQuery.value }) }}
          </template>
          <template v-else>
            {{ $t('desktop_quotes_grid.empty_description') }}
          </template>
        </p>

        <div v-if="!feed.searchQuery?.value" class="mt-8">
          <NButton
            btn="light:soft-secondary dark:soft-blue"
            leading="i-ph-plus-circle"
            class="hover:scale-102 active:scale-99 transition-[transform] duration-150"
            @click="showNewQuoteDialog = true"
          >
            {{ $t('desktop_quotes_grid.submit_quote') }}
          </NButton>
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
}>()

const selectedQuote = ref<ProcessedQuoteResult | null>(null)
const showNewQuoteDialog = ref(false)
const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showReportDialog = ref(false)

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
