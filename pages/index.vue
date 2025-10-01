<template>
  <div class="min-h-screen">
    <!-- Desktop Header -->
    <header v-if="!isMobile">
      <div v-if="showHomeTitle" class="relative p-8">
        <h1 class="font-title font-600 text-center line-height-none uppercase default">Verbatims</h1>
        <span class="text-center font-sans font-400 block text-gray-600 dark:text-gray-400">
          Discover <b>{{ stats.quotes || 0 }}</b> quotes from films, tv series, video games, books, music, podcasts, documentaries.
          It's an open source community platform. You can post your own interesting quotes.
        </span>

        <UTooltip content="Hide title" :_tooltip-content="{ side: 'bottom', sideOffset: 4 }">
          <UButton
            class="absolute right-8 top-8 hover:animate-pulse"
            :btn="['text-lime', 'text-blue', 'text-red', 'text-yellow'][Math.floor(Math.random() * 4)]"
            size="sm"
            icon
            label="i-ph-asterisk-bold"
            @click="showHomeTitle = false"
          />
        </UTooltip>
      </div>
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

    <!-- Initial-only loading: render identically on SSR and during hydration -->
    <div v-if="!hydrated || !isLanguageReady || feed.initialLoading?.value" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !hydrated ? 'Loading...' : (!isLanguageReady ? 'Initializing...' : 'Loading quotes...') }}
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
import { useStorage } from '@vueuse/core'
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default'
})

useHead({
  title: 'verbatims • universal quotes',
  meta: [
    {
      name: 'description',
      content: `Discover inspiring quotes from authors, films, books, and more. 
        A comprehensive, user-generated quotes database with moderation capabilities.`,
    }
  ]
})

type StatsResponse = { quotes: number; authors: number; references: number; users: number }
type OnboardingResponse = { needsOnboarding?: boolean; step?: string; hasAdminUser?: boolean; hasData?: boolean }

const showHomeTitle = useStorage('verbatims.show_home_title', true)
const { isLanguageReady } = useLanguageReady()
const feed = useQuoteSearchFeed()

const { data: statsData } = await useFetch<{ data?: StatsResponse }>('/api/stats')
const { data: onboardingData } = await useFetch<{ data?: OnboardingResponse }>('/api/onboarding/status')

// Ensure the computed values always match the shapes expected by child components
const stats = computed<StatsResponse>(() => statsData.value?.data || { quotes: 0, authors: 0, references: 0, users: 0 })
const onboardingStatus = computed<OnboardingResponse>(() => onboardingData.value?.data || { needsOnboarding: false, step: undefined, hasAdminUser: false, hasData: false })
const needsOnboarding = computed(() => !!onboardingStatus.value?.needsOnboarding)

const showAddQuoteDrawer = ref(false)
// Mark as ready only after Nuxt has fully hydrated to avoid layout switching during hydration
const hydrated = ref(false)

onMounted(() => {
  feed.init()
})

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
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
  if (hydrated.value) setPageLayout(newLayout)
})
</script>

<style scoped>
header h1.default {
  font-size: 4.0rem;
  transition: font-size 0.3s ease;

  @media (min-width: 480px)   { font-size: 8.5rem;  }
  @media (min-width: 768px)   { font-size: 10.0rem; }
  @media (min-width: 812px)   { font-size: 12.0rem; }
  @media (min-width: 912px)   { font-size: 13.5rem; }
  @media (min-width: 1024px)  { font-size: 15.0rem; }
  @media (min-width: 1224px)  { font-size: 18.0rem; }
  @media (min-width: 1380px)  { font-size: 20.5rem; }
}
</style>