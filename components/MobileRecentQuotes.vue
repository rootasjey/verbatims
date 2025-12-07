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

    <!-- Mobile inverted pull-to-load-more (pull up from bottom) -->
    <div
      v-if="feed?.hasMore?.value || feed?.loadingMore?.value"
      class="overflow-hidden select-none mt-6"
      :style="{ height: `${Math.max(40, pullDistance)}px` }"
      @touchstart.passive="onPullStart"
      @touchmove="onPullMove"
      @touchend="onPullEnd"
    >
      <div class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        <template v-if="!feed.loadingMore?.value">
          <NButton v-if="pullDistance < pullThreshold && feed.hasMore?.value" btn="text" @click="feed.loadMore">Pull up to load more</NButton>
          <span v-else-if="feed.hasMore?.value">Release to load more</span>
          <span v-else>No more quotes</span>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-spinner" class="w-5 h-5 animate-spin" />
            <span>Loading more quotes...</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { feed } = defineProps<{
  feed: UseQuoteSearchFeed
  limit?: number
}>()

// Pull-up gesture state
const pullDistance = ref(0)
const isPulling = ref(false)
const startY = ref(0)
const pullThreshold = 80

const atBottom = () => {
  const scrollEl = document.scrollingElement || document.documentElement
  return scrollEl.scrollHeight - (scrollEl.scrollTop + window.innerHeight) <= 2
}

const onPullStart = (e: TouchEvent) => {
  if (feed.loadingMore?.value || !feed.hasMore?.value) return
  if (!atBottom()) return
  isPulling.value = true
  const touch = e.touches?.[0]
  startY.value = (touch?.clientY || 0)
  pullDistance.value = 0
}

const onPullMove = (e: TouchEvent) => {
  if (!isPulling.value) return
  const touch = e.touches?.[0]
  const currentY = (touch?.clientY || 0)
  const delta = startY.value - currentY // moving up => positive
  if (delta > 0) {
    pullDistance.value = Math.min(delta, pullThreshold * 1.8)
    if (e.cancelable) e.preventDefault()
  } else {
    pullDistance.value = 0
  }
}

const onPullEnd = async () => {
  if (!isPulling.value) return
  const shouldLoad = pullDistance.value >= pullThreshold
  isPulling.value = false
  pullDistance.value = 0
  if (shouldLoad && feed.hasMore?.value && !feed.loadingMore?.value) {
    await feed.loadMore()
  }
}
</script>
