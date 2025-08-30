<template>
  <div class="min-h-screen">
    <!-- Desktop Header -->
    <header v-if="!isMobile" class="p-8">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">Verbatims</h1>
      <span class="-mt-12 text-center font-sans font-400 block text-gray-600 dark:text-gray-400">
        Discover <b>{{ stats.quotes || 0 }}</b> quotes from films, tv series, video games, books, music, podcasts, documentaries.
        It's an open source community platform. You can post your own interesting quotes.
      </span>
    </header>

    <div v-else>
      <MobileHeroSection
        :quote="feed.quotes?.value?.[0]"
        @new-quote="handleNewQuote"
        @on-click-quote="handleClickQuote"
        @on-click-author="handleClickAuthor"
      />

      <MobileRecentAuthors
        @show-more="navigateTo('/authors')"
      />

      <MobileRecentReferences
        @show-more="navigateTo('/references')"
      />
    </div>

    <!-- Initial-only loading: show until first successful data load -->
    <div v-if="!isLanguageReady || feed.initialLoading?.value" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !isLanguageReady ? 'Initializing...' : 'Loading quotes...' }}
        </span>
      </div>
    </div>

    <HomeEmptyView
      v-else-if="(stats.quotes === 0 || needsOnboarding) && !feed.quotesLoading?.value"
      :needs-onboarding="needsOnboarding"
      :onboarding-status="onboardingStatus"
      :stats="stats"
    />

    <DesktopQuotesGrid v-else-if="!isMobile" :feed="feed" />
    <MobileRecentQuotes v-if="isMobile" :feed="feed" :limit="5" />

    <AddQuoteDrawer
      v-if="isMobile"
      v-model:open="showAddQuoteDrawer"
      @submitted="feed.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false // layout switching handled dynamically in watcher
})

useHead({
  title: 'Verbatims • Universal Quotes',
  meta: [
    {
      name: 'description',
      content: 'Discover inspiring quotes from authors, films, books, and more. A comprehensive, user-generated quotes database with moderation capabilities.',
    }
  ]
})

const { isLanguageReady } = useLanguageReady()
const feed = useQuoteSearchFeed()

const { data: statsData } = await useFetch('/api/stats')
const { data: onboardingData } = await useFetch('/api/onboarding/status')

const stats = computed(() => statsData.value?.data || { quotes: 0, authors: 0, references: 0, users: 0 })
const onboardingStatus = computed(() => onboardingData.value?.data)
const needsOnboarding = computed(() => onboardingStatus.value?.needsOnboarding || false)

const showAddQuoteDrawer = ref(false)

onMounted(() => {
  setPageLayout(currentLayout.value)
  feed.init()
})

const handleNewQuote = () => {
  showAddQuoteDrawer.value = true
}

const handleClickQuote = (quoteId: number) => {
  navigateTo(`/quotes/${quoteId}`)
}

const handleClickAuthor = (authorId: number) => {
  navigateTo(`/authors/${authorId}`)
}

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})
</script>