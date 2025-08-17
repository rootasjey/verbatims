<template>
  <div class="min-h-screen">
    <header class="p-8">
      <h1 class="font-title text-size-82 font-600 text-center line-height-none uppercase">Verbatims</h1>
      <span class="-mt-12 text-center font-sans font-400 block text-gray-600 dark:text-gray-400">
        Discover <b>{{ stats.quotes || 0 }}</b> quotes from films, tv series, video games, books, music, podcasts, documentaries.
        It's an open source community platform. You can post your own interesting quotes.
      </span>
    </header>

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

    <!-- Quotes Grid: stays mounted; shows thin spinner during refetch -->
    <div v-else class="mt-6 px-8 pb-16">
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
          v-for="q in feed.quotes?.value"
          :key="(q as any).id"
          :quote="q"
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
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Verbatims • Universal Quotes',
  meta: [
    {
      name: 'description',
      content: 'Discover inspiring quotes from authors, films, books, and more. A comprehensive, user-generated NCombobox database with moderation capabilities.',
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

onMounted(() => {
  feed.init()
})
</script>