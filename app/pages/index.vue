<template>
  <div class="min-h-screen" :style="themeVars">
    <!-- Skeleton: shown during SSR/hydration/data loading, delayed on client nav -->
    <div v-if="showSkeleton">
      <div class="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
        <!-- Featured section skeleton -->
        <div class="px-6 pt-10 pb-6 animate-pulse">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28" />
          </div>
          <div class="space-y-3 mb-6">
            <div class="h-7 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div class="h-7 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>

        <div class="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6" />

        <!-- Authors section skeleton -->
        <div class="px-6 py-6 animate-pulse">
          <div class="flex items-center gap-2 mb-5">
            <div class="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div class="flex gap-4 overflow-hidden">
            <div v-for="i in 4" :key="i" class="flex-shrink-0 flex gap-3">
              <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div class="space-y-2">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-14" />
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6" />

        <!-- References section skeleton -->
        <div class="px-6 py-6 animate-pulse">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-5" />
          <div class="flex gap-4 overflow-hidden">
            <div v-for="i in 3" :key="i" class="flex-shrink-0 w-36">
              <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded-sm mb-2" />
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
              <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>

        <div class="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6" />

        <!-- Recent quotes section skeleton -->
        <div class="px-6 py-6 animate-pulse">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-6" />
          <div class="space-y-5">
            <div v-for="i in 3" :key="i" class="space-y-2 pb-5 border-b border-gray-100 dark:border-gray-800">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <HomeEmptyView v-else-if="(stats.quotes === 0 || needsOnboarding) && !feed.quotesLoading?.value"
      :needs-onboarding="needsOnboarding" :onboarding-status="onboardingStatus" :stats="stats" />

    <HomeDesktopFeed v-if="hydrated && !showMobileFeed && !(stats.quotes === 0 || needsOnboarding)" :feed="feed" :stats="stats" :theme="themeData" />
    <MobileHomeFeed v-if="hydrated && showMobileFeed && !(stats.quotes === 0 || needsOnboarding)" :feed="feed" :theme="themeData" :stats="stats" @new-quote="showAddQuoteDrawer = true" />

    <ClientOnly>
      <AddQuoteDrawer v-model:open="showAddQuoteDrawer" @submitted="feed.refresh()" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core'

const { $t, $ts } = useI18n()

const { isMobile } = useMobileDetection()

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
const languageStore = useLanguageStore()
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

const themeQuery = computed(() => languageStore.getLanguageQuery())

const { data: activeThemeData, refresh: refreshActiveTheme } = await useFetch<{ data?: typeof themeData.value }>('/api/themes/active', {
  query: themeQuery,
})
if (activeThemeData.value?.data) {
  themeData.value = activeThemeData.value.data
}

const pageTitle = computed(() => {
  if (themeData.value) return `${themeData.value.name} — Verbatims`
  return $ts('home.page_title')
})

const pageDescription = computed(() => {
  if (themeData.value?.description) return themeData.value.description
  return $ts('home.page_desc')
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
  description: $t('home.jsonld_desc'),
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
const appReady = useState('app-ready', () => false)
// On first SSR/hydration: hydrated starts false (matching SSR). On client nav: starts true.
const hydrated = ref(appReady.value)

// Eager mobile detection so MobileHomeFeed renders immediately on client nav
const isMobileClient = ref(import.meta.client ? window.innerWidth < 768 : false)
const showMobileFeed = computed(() => isMobileClient.value || isMobile.value)

// Skeleton: shown during SSR/hydration. On client nav, hidden initially, shown after 300ms if still loading.
const showSkeleton = ref(!appReady.value)
onMounted(() => {
  const timer = setTimeout(() => {
    const stillLoading = !hydrated.value || !isLanguageReady.value || !!feed.initialLoading?.value
    if (stillLoading) showSkeleton.value = true
  }, 300)
  const stop = watch([hydrated, isLanguageReady, () => feed.initialLoading?.value], () => {
    if (hydrated.value && isLanguageReady.value && !feed.initialLoading?.value) {
      clearTimeout(timer)
      showSkeleton.value = false
      stop()
    }
  })
})

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

  return quotesFeedStore.cloneSnapshot(snapshot)
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

// Refresh active theme when content language changes
watch(() => languageStore.currentLanguageValue, async (newLang, oldLang) => {
  if (!import.meta.client || newLang === oldLang) return
  await refreshActiveTheme()
  if (activeThemeData.value?.data) {
    themeData.value = activeThemeData.value.data
    await feed.setTheme(themeData.value)
  } else {
    themeData.value = null
    await feed.setTheme(null)
    await feed.init()
  }
})

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

onUnmounted(() => {
  removeScrollListener?.()
})
</script>
