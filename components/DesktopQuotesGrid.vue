<template>
  <!-- Desktop: Quotes Grid with Search -->
  <div class="mt-6 px-8 pb-16">
    <div class="flex gap-4 font-body mb-8">
      <div class="flex-grow-2 font-600">
        <UInput
          :model-value="feed.searchQuery?.value"
          @update:model-value="val => (feed.searchQuery.value = val)"
          placeholder="Search quotes..."
          leading="i-ph-magnifying-glass"
          size="md"
          :loading="feed.quotesLoading?.value"
        />
      </div>
      <div class="flex-1">
        <LanguageSelector @language-changed="feed.onLanguageChange" />
      </div>

      <div class="flex gap-4 items-center">
        <USelect
          :model-value="feed.selectedSortBy?.value"
          @update:model-value="val => (feed.selectedSortBy.value = val)"
          :items="feed.sortByOptions"
          placeholder="Sort by"
          size="sm"
          item-key="label"
          value-key="label"
        />
        <!-- Order Toggle: OFF = Desc (↓), ON = Asc (↑) -->
        <div class="flex items-center gap-2">
          <UToggle
            :model-value="feed.isAsc?.value"
            @update:model-value="val => (feed.isAsc.value = val)"
            size="sm"
            :label="feed.isAsc?.value ? 'i-ph-sort-descending-duotone' : 'i-ph-sort-ascending-duotone'"
            :aria-label="feed.isAsc?.value ? 'Ascending' : 'Descending'"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
      <QuoteGridItem
        v-for="q in feed.quotes.value"
        :key="q.id"
        :quote="q"
        @edit="openEdit"
        @delete="openDelete"
        @report="openReport"
      />
    </div>

    <div v-if="feed.hasMore?.value" class="text-center">
      <UButton
        @click="feed.loadMore"
        :loading="feed.loadingMore?.value"
        :disabled="feed.loadingMore?.value"
        size="sm"
        btn="solid-black"
        class="px-8 py-6 w-full rounded-3 hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
      >
        {{ feed.loadingMore?.value ? 'Loading...' : 'Load More Quotes' }}
      </UButton>
    </div>
  </div>

  <AddQuoteDialog
    v-model="showEditQuoteDialog"
    :edit-quote="selectedQuote as any"
    @quote-updated="closeEditAfterUpdate"
  />

  <DeleteQuoteDialog
    v-model="showDeleteQuoteDialog"
    :quote="selectedQuote as any"
    @quote-deleted="onQuoteDeleted"
  />

  <ReportDialog
    v-model="showReportDialog"
    targetType="quote"
    :targetId="selectedQuote?.id"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  feed: UseQuoteSearchFeed
}>()

import type { ProcessedQuoteResult } from '~/types'

const selectedQuote = ref<ProcessedQuoteResult | null>(null)
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

const closeEditAfterUpdate = async () => {
  showEditQuoteDialog.value = false
  
  try { // Fetch fresh data for the updated quote and patch it locally in the feed
    if (!selectedQuote.value?.id) return
    const res = await $fetch(`/api/quotes/${selectedQuote.value.id}`)
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
