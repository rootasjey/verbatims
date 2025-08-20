<template>
  <div class="px-6 py-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-body font-200 text-gray-900 dark:text-white">
        recent quotes
      </h2>
      <UButton
        btn="ghost-gray"
        size="sm"
        @click="navigateTo('/search')"
      >
        <UIcon name="i-ph-magnifying-glass-bold" class="w-4 h-4 mr-1" />
        <span class="text-sm">Search</span>
      </UButton>
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

    <div v-if="feed?.hasMore?.value" class="mt-6">
      <UButton
        @click="feed.loadMore"
        :loading="feed.loadingMore?.value"
        :disabled="feed.loadingMore?.value"
        size="md"
        btn="outline-gray"
        class="w-full py-4 rounded-xl hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
      >
        {{ feed.loadingMore?.value ? 'Loading...' : 'Load More Quotes' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  feed: UseQuoteSearchFeed
  limit?: number
}>()
</script>
