<template>
  <div class="min-h-screen" :style="themeVars">
    <!-- Initial-only loading: render identically on SSR and during hydration -->
    <div v-if="!hydrated || !isLanguageReady || feed.initialLoading?.value"
      class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !hydrated ? 'Loading...' : (!isLanguageReady ? 'Initializing...' : 'Loading feed...') }}
        </span>
      </div>
    </div>

    <HomeEmptyView v-else-if="(stats.quotes === 0 || needsOnboarding) && !feed.quotesLoading?.value"
      :needs-onboarding="needsOnboarding" :onboarding-status="onboardingStatus" :stats="stats" />

    <HomeDesktopFeed v-if="!isMobile && !(stats.quotes === 0 || needsOnboarding)" :feed="feed" :stats="stats" :theme="themeData" />
    <MobileHomeFeed v-if="hydrated && isMobile && !(stats.quotes === 0 || needsOnboarding)" :feed="feed" :theme="themeData" :stats="stats" @new-quote="showAddQuoteDrawer = true" />

    <ClientOnly>
      <AddQuoteDrawer v-model:open="showAddQuoteDrawer" @submitted="feed.refresh()" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const quotesFeedStore = useQuotesFeedStore()
const restoreSourcePath = '/'
let removeScrollListener: (() => void) | null = null
const lastKnownScrollY = ref(0)

definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default',
  scrollToTop: false
})

import { useJsonLd } from '../composables/useSeo'

type StatsResponse = { quotes: number; authors: number; references: number; users: number }
type OnboardingResponse = { needsOnboarding?: boolean; step?: string; hasAdminUser?: boolean; hasData?: boolean }

const { isLanguageReady } = useLanguageReady()
const feed = useHomeFeed()

const themeData = ref<{
  slug: string
  name: string
  description: string | null
  image_url: string | null
  config: Record<string, any> | null
} | null>(null)

const { data: statsData } = await useFetch<{ data?: StatsResponse }>('/api/stats')
const { data: onboardingData } = await useFetch<{ data?: OnboardingResponse }>('/api/onboarding/status')

const { data: activeThemeData } = await useFetch<{ data?: typeof themeData.value }>('/api/themes/active')
if (activeThemeData.value?.data) {
  themeData.value = activeThemeData.value.data
}

const pageTitle = computed(() => {
  if (themeData.value) return `${themeData.value.name} — Verbatims`
  return 'Verbatims • A flow of quotes'
})

const pageDescription = computed(() => {
  if (themeData.value?.description) return themeData.value.description
  return 'Discover inspiring quotes from authors, films, books, and more.'
})

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: 'https://verbatims.cc' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
  ],
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: 'https://verbatims.cc',
  name: 'Verbatims',
  description: 'A comprehensive, user-generated quotes service',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://verbatims.cc/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
})

// Ensure the computed values always match the shapes expected by child components
const stats = computed<StatsResponse>(() => statsData.value?.data || { quotes: 0, authors: 0, references: 0, users: 0 })
const onboardingStatus = computed<OnboardingResponse>(() => onboardingData.value?.data || { needsOnboarding: false, step: undefined, hasAdminUser: false, hasData: false })
const needsOnboarding = computed(() => !!onboardingStatus.value?.needsOnboarding)

const themeVars = computed(() => {
  if (!themeData.value?.config) return {}
  const cfg = themeData.value.config
  return {
    '--theme-primary': cfg.color_primary || '#6366f1',
    '--theme-secondary': cfg.color_secondary || '#FAB95B',
  }
})

const showAddQuoteDrawer = ref(false)
// Mark as ready only after Nuxt has fully hydrated to avoid layout switching during hydration
const hydrated = ref(false)

const saveCurrentQuotesState = () => {
  if (typeof window === 'undefined') return

  quotesFeedStore.saveSnapshot({
    ...feed.exportSnapshot(),
    sourcePath: restoreSourcePath,
    scrollY: lastKnownScrollY.value
  })
}

const debouncedSaveScrollState = useDebounceFn(() => {
  saveCurrentQuotesState()
}, 100)

const cloneSnapshot = (snapshot: typeof quotesFeedStore.snapshot) => {
  if (!snapshot) return null

  return {
    ...snapshot,
    additionalQuotes: [...snapshot.additionalQuotes],
    lastSuccessfulQuotes: [...snapshot.lastSuccessfulQuotes],
    lastSuccessfulMeta: { ...snapshot.lastSuccessfulMeta }
  }
}

const restoreScrollPosition = async (scrollY: number) => {
  if (typeof window === 'undefined' || scrollY <= 0) return

  for (let attempt = 0; attempt < 12; attempt++) {
    await nextTick()

    const scrollingElement = document.scrollingElement || document.documentElement
    const hasEnoughHeight = scrollingElement.scrollHeight >= scrollY + window.innerHeight
    if (hasEnoughHeight || attempt === 11) {
      window.scrollTo({ top: scrollY, behavior: 'auto' })

      await new Promise(resolve => window.setTimeout(resolve, 50))

      if (Math.abs(window.scrollY - scrollY) <= 4 || attempt === 11) {
        return
      }
    }

    await new Promise(resolve => window.setTimeout(resolve, 50))
  }
}

const getRestorableSnapshot = () => {
  const snapshot = quotesFeedStore.restoreSnapshot ?? quotesFeedStore.snapshot

  if (!quotesFeedStore.shouldRestore || snapshot?.sourcePath !== restoreSourcePath) {
    return null
  }

  return cloneSnapshot(snapshot)
}

const restoreFeedFromSnapshot = async () => {
  const snapshot = getRestorableSnapshot()
  if (!snapshot) return false

  feed.hydrateFromSnapshot(snapshot)
  await restoreScrollPosition(snapshot.scrollY)
  quotesFeedStore.clearRestoreRequest()
  quotesFeedStore.clearRestoreSnapshot()
  return true
}

onMounted(() => {
  const snapshot = getRestorableSnapshot()

  void (async () => {
    if (themeData.value) {
      await feed.setTheme(themeData.value)
    } else {
      await feed.init(snapshot)
    }

    if (snapshot && !themeData.value) {
      await restoreScrollPosition(snapshot.scrollY)
      quotesFeedStore.clearRestoreRequest()
    } else if (quotesFeedStore.shouldRestore) {
      quotesFeedStore.clearRestoreRequest()
    }

    if (typeof window !== 'undefined') {
      lastKnownScrollY.value = window.scrollY

      const onScroll = () => {
        lastKnownScrollY.value = window.scrollY
        debouncedSaveScrollState()
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      removeScrollListener = () => window.removeEventListener('scroll', onScroll)
    }
  })()
})

onActivated(async () => {
  await restoreFeedFromSnapshot()
})

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

onBeforeRouteLeave((to) => {
  if (typeof window === 'undefined') return

  saveCurrentQuotesState()

  if (to.path.startsWith('/quotes/')) {
    quotesFeedStore.stageRestoreSnapshot({
      ...feed.exportSnapshot(),
      sourcePath: restoreSourcePath,
      scrollY: lastKnownScrollY.value
    })
    quotesFeedStore.requestRestore()
  } else {
    quotesFeedStore.clearRestoreRequest()
    quotesFeedStore.clearRestoreSnapshot()
  }
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
})

onUnmounted(() => {
  removeScrollListener?.()
})
</script>
