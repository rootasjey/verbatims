<template>
  <div class="homepage-v3-page min-h-screen" :style="themeVars">
    <!-- Loading shells follow the editorial cover and section layouts at each breakpoint. -->
    <div v-if="showSkeleton" aria-busy="true" class="min-h-screen bg-[#F7F5EF] dark:bg-[#0C0A09]">
      <div class="hidden md:block">
        <div class="mx-auto w-full max-w-[1440px] px-4 lg:px-8">
          <div class="homepage-v3-hero-stage" aria-hidden="true">
            <section class="homepage-v3-cover homepage-v3-cover--hero px-10 py-24 shadow-sm">
              <div class="w-full max-w-[1040px] space-y-5 animate-pulse">
                <div class="mx-auto h-12 w-5/6 rounded bg-black/10 dark:bg-white/10 lg:h-16" />
                <div class="mx-auto h-12 w-2/3 rounded bg-black/10 dark:bg-white/10 lg:h-16" />
                <div class="mx-auto mt-10 h-6 w-48 rounded bg-black/10 dark:bg-white/10" />
                <div class="mx-auto h-3 w-28 rounded bg-black/10 dark:bg-white/10" />
              </div>
            </section>
            <div class="relative mx-auto mb-16 flex w-full max-w-[1440px] items-center justify-center gap-4 px-4 lg:px-8" aria-hidden="true">
              <div class="inline-flex h-10 w-44 items-center justify-center gap-2 rounded-full border border-black/10 font-sans text-xs font-600 text-gray-500 dark:border-white/10 dark:text-gray-400">
                {{ $t('home.explore_theme') }}
                <NIcon name="i-lucide-arrow-down" class="h-3.5 w-3.5" />
              </div>
              <div class="absolute right-4 flex gap-2 lg:right-8">
                <div class="h-9 w-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                <div class="h-9 w-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>

          <section class="mx-4 mb-24 pt-14" aria-hidden="true">
            <div class="animate-pulse">
              <div class="h-3 w-44 rounded bg-gray-200 dark:bg-gray-800" />
              <div class="mt-8 h-10 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div class="mt-3 h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div class="mt-14 max-w-4xl space-y-3">
                <div class="h-10 w-5/6 rounded bg-gray-200 dark:bg-gray-800 lg:h-14" />
                <div class="h-10 w-2/3 rounded bg-gray-200 dark:bg-gray-800 lg:h-14" />
                <div class="mt-4 h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div class="mt-16 grid grid-cols-2 gap-24">
                <div v-for="item in 2" :key="item" class="space-y-3 border-t border-gray-200 pt-8 dark:border-gray-800">
                  <div class="h-7 w-full rounded bg-gray-200 dark:bg-gray-800" />
                  <div class="h-7 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                  <div class="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          </section>

          <section class="mb-14 rounded-2xl bg-[#e7e4dd] px-6 py-16 dark:bg-[#252522] lg:px-10" aria-hidden="true">
            <h2 class="mb-8 font-serif text-4xl text-stone-700 dark:text-stone-300 lg:text-5xl">{{ $t('nav.references') }}</h2>
            <div class="grid grid-cols-4 gap-4 animate-pulse">
              <div v-for="item in 4" :key="item" class="flex h-[440px] flex-col justify-end rounded-xl bg-black/[0.08] p-5 dark:bg-white/[0.06]">
                <div class="h-5 w-4/5 rounded bg-black/10 dark:bg-white/10" />
                <div class="mt-2 h-3 w-1/2 rounded bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          </section>

          <section class="mx-4 mb-14" aria-hidden="true">
            <div class="flex items-end justify-between gap-6">
              <div class="h-10 w-2/5 rounded bg-gray-200 dark:bg-gray-800" />
              <div class="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div class="mt-12 grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-800 animate-pulse">
              <div v-for="item in 6" :key="item" class="min-h-[190px] space-y-3 p-5 first:pl-0">
                <div class="h-6 w-full rounded bg-gray-200 dark:bg-gray-800" />
                <div class="h-6 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
                <div class="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </section>

          <section class="mb-14 rounded-2xl bg-[#17191e] px-6 py-16 lg:px-10" aria-hidden="true">
            <h2 class="mb-3 font-serif text-4xl text-white lg:text-6xl">{{ $t('nav.authors') }}</h2>
            <div class="mb-8 h-4 w-80 max-w-full rounded bg-white/10" />
            <div class="flex gap-4 overflow-hidden animate-pulse">
              <div v-for="item in 5" :key="item" class="flex w-[calc((100%-4rem)/5)] shrink-0 flex-col gap-4">
                <div class="h-12 w-12 rounded-full bg-white/10" />
                <div class="h-4 w-4/5 rounded bg-white/10" />
                <div class="h-3 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="md:hidden">
        <div class="homepage-v3-hero-stage" aria-hidden="true">
          <section class="homepage-v3-cover homepage-v3-cover--hero px-6 py-16 shadow-sm">
            <div class="w-full max-w-md space-y-3 text-center animate-pulse">
              <div class="mx-auto h-7 w-11/12 rounded bg-black/10 dark:bg-white/10" />
              <div class="mx-auto h-7 w-10/12 rounded bg-black/10 dark:bg-white/10" />
              <div class="mx-auto h-7 w-8/12 rounded bg-black/10 dark:bg-white/10" />
              <div class="mx-auto mt-8 h-8 w-8 rounded-full bg-black/10 dark:bg-white/10" />
              <div class="mx-auto h-4 w-40 rounded bg-black/10 dark:bg-white/10" />
              <div class="mx-auto h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </section>
          <div class="mb-14 flex items-center justify-center gap-3" aria-hidden="true">
            <div class="inline-flex h-10 w-44 items-center justify-center gap-2 rounded-full border border-black/10 font-sans text-xs font-600 text-gray-500 dark:border-white/10 dark:text-gray-400">
              {{ $t('home.explore_theme') }}
              <NIcon name="i-lucide-arrow-down" class="h-3.5 w-3.5" />
            </div>
            <div class="h-9 w-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
            <div class="h-9 w-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>

        <section class="mb-16 px-6 py-14" aria-hidden="true">
          <div class="animate-pulse">
            <div class="h-3 w-36 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="mt-5 h-7 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="mt-5 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="mt-12 space-y-3">
              <div class="h-8 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div class="h-8 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
              <div class="mt-4 h-3 w-36 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div class="mt-10 space-y-8">
              <div v-for="item in 2" :key="item" class="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <div class="h-5 w-full rounded bg-gray-200 dark:bg-gray-800" />
                <div class="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div class="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        </section>

        <section class="mx-6 py-14" aria-hidden="true">
          <div class="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          <div class="mt-3 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div class="mt-10 grid grid-cols-2 animate-pulse">
            <div v-for="item in 4" :key="item" class="min-h-[190px] space-y-3 border-b border-gray-200 p-4 first:pl-0 dark:border-gray-800">
              <div class="h-5 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div class="h-5 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
              <div class="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </section>

        <section class="px-6 py-14 text-white" aria-hidden="true">
          <h2 class="mb-3 font-serif text-4xl">{{ $t('home.nav.authors') }}</h2>
          <div class="mb-8 h-4 w-3/4 rounded bg-white/10" />
          <div class="flex gap-4 overflow-hidden animate-pulse">
            <div v-for="item in 3" :key="item" class="flex h-[330px] w-[78vw] shrink-0 flex-col justify-end gap-3 rounded-xl border border-white/10 p-4">
              <div class="h-12 w-12 rounded-full bg-white/10" />
              <div class="h-4 w-3/4 rounded bg-white/10" />
              <div class="h-3 w-1/2 rounded bg-white/10" />
            </div>
          </div>
        </section>

        <section class="bg-[#e7e4dd] px-6 py-14 dark:bg-[#252522]" aria-hidden="true">
          <h2 class="mb-3 font-serif text-4xl text-stone-700 dark:text-stone-300">{{ $t('home.nav.references') }}</h2>
          <div class="mb-8 h-4 w-3/4 rounded bg-black/10 dark:bg-white/10" />
          <div class="flex gap-3 overflow-hidden animate-pulse">
            <div v-for="item in 3" :key="item" class="flex h-[320px] w-52 shrink-0 flex-col justify-end rounded-xl bg-black/[0.08] p-4 dark:bg-white/[0.06]">
              <div class="h-4 w-4/5 rounded bg-black/10 dark:bg-white/10" />
              <div class="mt-2 h-3 w-1/2 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        </section>
      </div>
    </div>

    <HomeEmptyView v-else-if="showHomepageEmpty"
      :needs-onboarding="needsOnboarding" :onboarding-status="onboardingStatus" :stats="stats" />

    <HomeDesktopFeed v-else-if="hydrated && !showMobileFeed" :feed="feed" :stats="stats" :theme="themeData" />
    <MobileHomeFeed v-else-if="hydrated && showMobileFeed" :feed="feed" :theme="themeData" :stats="stats" @new-quote="showAddQuoteDrawer = true" />

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
  home_copy?: Record<string, string> | null
} | null>(null)
const activeHomeTheme = useState<typeof themeData.value>('active-home-theme', () => null)

const { data: statsData, status: statsRequestStatus } = await useFetch<{ data?: StatsResponse }>('/api/stats')
const { data: onboardingData, status: onboardingRequestStatus } = await useFetch<{ data?: OnboardingResponse }>('/api/onboarding/status')

const route = useRoute()
const themeQuery = computed(() => {
  const query: Record<string, string> = languageStore.getLanguageQuery()
  const themePreview = route.query.theme
  if (themePreview) {
    query.theme = String(Array.isArray(themePreview) ? themePreview[0] : themePreview)
  }
  return query
})

const { data: activeThemeData, refresh: refreshActiveTheme } = await useFetch<{ data?: typeof themeData.value }>('/api/themes/active', {
  query: themeQuery,
})
// Set themeData from available data (SSR payload on first pass, or async fetch)
if (activeThemeData.value?.data) {
  themeData.value = activeThemeData.value.data
}
activeHomeTheme.value = themeData.value
// Track whether feed.setTheme() has been called to avoid redundant
// themed-feed fetches (watcher + onMounted both try to call it).
const themeFeedStarted = ref(false)

// Reactively sync themeData with useFetch whenever its payload arrives
// (SSR hydration or async client fetch). Also calls feed.setTheme() so
// the theme activates even when the if-check above misses the payload.
watch(activeThemeData, async (data) => {
  if (data?.data) {
    themeData.value = data.data
    activeHomeTheme.value = data.data
    if (import.meta.client && !themeFeedStarted.value) {
      themeFeedStarted.value = true
      await feed.setTheme(data.data)
    }
  }
}, { immediate: true })

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
const showHomepageEmpty = computed(() =>
  statsRequestStatus.value === 'success'
  && onboardingRequestStatus.value === 'success'
  && (needsOnboarding.value || (stats.value.quotes === 0 && !feed.initialLoading.value))
)
const activeHomeStats = useState<StatsResponse>('active-home-stats', () => ({ quotes: 0, authors: 0, references: 0, users: 0 }))
watch(stats, value => { activeHomeStats.value = value }, { immediate: true })
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
const initialHomeDataLoading = computed(() =>
  !hydrated.value
  || !isLanguageReady.value
  || !!feed.initialLoading.value
  || statsRequestStatus.value === 'pending'
  || onboardingRequestStatus.value === 'pending'
)

// Eager mobile detection so MobileHomeFeed renders immediately on client nav
const isMobileClient = ref(import.meta.client ? window.innerWidth < 768 : false)
const showMobileFeed = computed(() => isMobileClient.value || isMobile.value)

// Skeleton: shown during SSR/hydration. On client nav, hidden initially, shown after 300ms if still loading.
const showSkeleton = ref(!appReady.value)
onMounted(() => {
  const timer = setTimeout(() => {
    if (initialHomeDataLoading.value) showSkeleton.value = true
  }, 300)
  const stop = watch(initialHomeDataLoading, (stillLoading) => {
    if (!stillLoading) {
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
// Skip during SSR→client hydration: the language store initializes from
// localStorage after onNuxtReady fires, which would discard the SSR-fetched
// theme before the UI becomes visible. Without this guard, refreshing the
// page shows no theme until a client navigation re-fetches it.
watch(() => languageStore.currentLanguageValue, async (newLang, oldLang) => {
  if (!import.meta.client || newLang === oldLang) return
  if (!hydrated.value) return
  await refreshActiveTheme()
  if (activeThemeData.value?.data) {
    themeData.value = activeThemeData.value.data
    activeHomeTheme.value = activeThemeData.value.data
    await feed.setTheme(themeData.value)
  } else if (!themeData.value) {
    themeData.value = null
    activeHomeTheme.value = null
    await feed.setTheme(null)
    await feed.init()
  }
})

onMounted(() => {
  const snapshot = getRestorableSnapshot()

  void (async () => {
    if (themeData.value && !themeFeedStarted.value) {
      themeFeedStarted.value = true
      await feed.setTheme(themeData.value)
    } else if (!themeData.value) {
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
