<template>
  <div class="min-h-screen">
    <header class="mt-12 md:mt-0 p-8">
      <h1 class="font-title text-size-16 sm:text-size-28 md:text-size-54 lg:text-size-64 xl:text-size-70 hyphens-auto overflow-hidden break-words font-600 text-center line-height-none uppercase">
        Quotes
      </h1>
      <p class="font-serif text-size-3 md:text-lg text-center text-gray-600 dark:text-gray-400 md:-mt-8">
        Browse the latest quotes added by the community.
      </p>
    </header>

    <!-- Content -->
    <div class="pb-16">
      <!-- Desktop grid with search/sort -->
      <DesktopQuotesGrid v-if="!isMobile" :feed="feed" />

      <!-- Mobile: list like MobileRecentQuotes -->
      <MobileRecentQuotes v-else :feed="feed" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false
})

useHead({
  title: 'Quotes - Verbatims',
  meta: [
    {
      name: 'description',
      content: 'Discover the most recently added quotes on Verbatims.'
    }
  ]
})

const feed = useQuoteSearchFeed()

onMounted(async () => {
  setPageLayout(currentLayout.value)
  // Ensure we start with Most Recent (created_at desc)
  feed.selectedSortBy.value = { label: 'Most Recent', value: 'created_at' }
  feed.isAsc.value = false
  await feed.init()
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})
</script>
