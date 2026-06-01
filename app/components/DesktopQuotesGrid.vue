<template>
  <div class="max-w-4xl mx-auto px-8 pb-16">
    <!-- Sticky controls bar -->
    <div class="sticky top-14 z-3 bg-gray-50 dark:bg-[#0C0A09] py-3 mb-6">
      <div class="flex gap-3 items-center">
        <div class="hidden md:block">
          <LanguageSelector @language-changed="feed.onLanguageChange" />
        </div>
        <div class="flex-1">
          <NInput
            ref="searchInput"
            :model-value="feed.searchQuery?.value"
            @update:model-value="val => (feed.searchQuery.value = val)"
            placeholder="Search quotes..."
            leading="i-ph-magnifying-glass"
            :trailing="feed.searchQuery?.value ? 'i-ph-x' : null"
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
            placeholder="Sort by"
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

    <div class="flex flex-wrap gap-18 mt-16 mb-12">
      <QuoteTextEntry
        v-for="q in feed.quotes.value"
        :key="q.id"
        :quote="q"
        @edit="openEdit"
        @delete="openDelete"
        @report="openReport"
      />
    </div>

    <div v-if="feed.hasMore?.value" class="flex justify-center">
      <LoadMoreButton
        class="mb-4"
        idleText="Load More Quotes"
        loadingText="Loading Quotes..."
        :isLoading="feed.quotesLoading?.value"
        @load="feed.loadMore()"
      />
    </div>

    <AddQuoteDialog v-model="showEditQuoteDialog" :edit-quote="selectedQuote as any"
      @quote-updated="closeEditAfterUpdate" />

    <DeleteQuoteDialog v-model="showDeleteQuoteDialog" :quote="selectedQuote as any" @quote-deleted="onQuoteDeleted" />

    <ReportDialog v-model="showReportDialog" targetType="quote" :targetId="selectedQuote?.id" />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types';

const props = defineProps<{
  feed: UseQuoteSearchFeed
}>()

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
