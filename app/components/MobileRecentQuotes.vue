<template>
  <div class="px-6 py-4">
    <div class="border-t border-dashed border-gray-300 dark:border-gray-700 pt-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: 'var(--theme-primary, #6366f1)' }" />
          <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
            Recent Quotes
          </p>
        </div>
        <button
          class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          @click="navigateTo('/quotes')"
        >
          See All
        </button>
      </div>

      <ScrollableTags class="mb-4" />

      <div v-if="feed?.quotes?.value && feed.quotes.value.length > 0" class="space-y-5">
        <div
          v-for="quote in feed.quotes.value.slice(0, limit)"
          :key="quote.id"
          class="pb-5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
        >
          <NuxtLink
            :to="`/quotes/${quote.id}`"
            class="block group"
          >
            <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              {{ truncateQuote(quote.name, 120) }}
            </blockquote>
            <div class="mt-2 flex items-center gap-2">
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {{ quote.author?.name || 'Unknown' }}
              </p>
              <span v-if="quote.reference" class="text-gray-300 dark:text-gray-600">·</span>
              <p v-if="quote.reference" class="font-sans text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors truncate">
                {{ quote.reference.name }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">
          No quotes yet. Be the first to add one!
        </p>
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
  </div>
</template>

<script setup lang="ts">
interface FeedView {
  quotes: Ref<any[]>
  hasMore?: Ref<boolean>
  loadingMore?: Ref<boolean>
  loadMore: () => Promise<void>
}

const props = defineProps<{
  feed: FeedView
  limit?: number
}>()

const truncateQuote = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>
