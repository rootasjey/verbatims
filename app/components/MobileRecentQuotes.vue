<template>
  <div class="px-6 py-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-body font-200 text-gray-900 dark:text-white">
        recent quotes
      </h2>
      <NButton
        btn="ghost-gray"
        size="sm"
        @click="navigateTo('/search')"
      >
        <NIcon name="i-ph-magnifying-glass-bold" class="w-4 h-4 mr-1" />
        <span class="text-sm">Search</span>
      </NButton>
    </div>

    <div v-if="feed?.quotes?.value && feed.quotes.value.length > 0" class="space-y-4">
      <QuoteListItem
        v-for="quote in feed.quotes.value.slice(0, limit)"
        :key="quote.id"
        :quote="quote"
        class="border rounded-1 border-gray-100 dark:border-dark-400"
      />
    </div>

    <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>No quotes yet. Be the first to add one!</p>
    </div>

    <div v-if="feed?.hasMore?.value" class="mt-6 flex justify-center">
      <LoadMoreButton
        :isLoading="feed.loadingMore?.value"
        idleText="Load More Quotes"
        loadingText="Loading Quotes..."
        @load="feed.loadMore"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { feed } = defineProps<{
  feed: UseQuoteSearchFeed
  limit?: number
}>()
</script>
