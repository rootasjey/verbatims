<template>
  <div class="min-h-screen">
    <header class="mx-auto max-w-6xl px-6 pb-8 pt-12 sm:px-8 md:pb-16 md:pt-28 lg:px-10">
      <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
        {{ $t('quotes_title') }}
      </h1>
      <p class="mt-4 max-w-3xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:mt-5 md:text-xl">
        {{ $t('quotes_subtitle') }}
      </p>
    </header>

    <!-- Content -->
    <div class="pb-16">
      <!-- Desktop grid with search/sort -->
      <DesktopQuotesGrid
        v-if="!isMobile"
        ref="searchInput"
        :feed="feed"
        :sort-options="quoteSortOptions"
        :show-initial-skeleton="showInitialSkeleton"
        :show-results-skeleton="showResultsSkeleton"
        :results-animation-key="resultsAnimationKey"
        :has-active-filters="hasActiveQuoteFilters"
        @clear-filters="clearQuoteFilters"
      />

      <!-- Mobile keeps the same search/sort/language controls in a compact layout. -->
      <MobileRecentQuotes
        v-else
        :feed="feed"
        :sort-options="quoteSortOptions"
        :show-initial-skeleton="showInitialSkeleton"
        :show-results-skeleton="showResultsSkeleton"
        :results-animation-key="resultsAnimationKey"
        :has-active-filters="hasActiveQuoteFilters"
        @add-quote="showAddQuote = true"
        @clear-filters="clearQuoteFilters"
      />
    </div>

    <ClientOnly>
      <AddQuoteDrawer v-model:open="showAddQuote" @submitted="feed.refresh()" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useJsonLd } from '~/composables/useSeo'
const { isMobile } = useMobileDetection()

const quotesFeedStore = useQuotesFeedStore()
const restoreSourcePath = '/quotes'
let removeScrollListener: (() => void) | null = null
const lastKnownScrollY = ref(0)

definePageMeta({
  layout: 'default',
  scrollToTop: false
})

const { $t, $ts } = useI18n()

useHead({
  title: $ts('quotes_meta_title'),
  meta: [
    {
      name: 'description',
      content: $ts('quotes_meta_desc'),
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: $t('quotes_breadcrumb_home'), item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: $t('quotes_breadcrumb'), item: 'https://verbatims.cc/quotes' }
  ]
})

const feed = useQuoteSearchFeed()
const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()
const INITIAL_QUOTES_SKELETON_DELAY = 180
const RESULTS_SKELETON_DELAY = 180
const showInitialSkeleton = ref(false)
const showResultsSkeleton = ref(false)
const resultsAnimationKey = ref(0)
const pageInitialized = ref(false)
const isApplyingRouteFilters = ref(false)
let initialSkeletonTimer: ReturnType<typeof setTimeout> | undefined
let resultsSkeletonTimer: ReturnType<typeof setTimeout> | undefined

watch(() => feed.initialLoading.value, (isLoading) => {
  if (initialSkeletonTimer) clearTimeout(initialSkeletonTimer)
  initialSkeletonTimer = undefined

  if (!isLoading) {
    showInitialSkeleton.value = false
    return
  }

  if (!import.meta.client) return

  initialSkeletonTimer = setTimeout(() => {
    showInitialSkeleton.value = feed.initialLoading.value
  }, INITIAL_QUOTES_SKELETON_DELAY)
}, { immediate: true })

watch(() => feed.quotesLoading.value, (isLoading, wasLoading) => {
  if (resultsSkeletonTimer) clearTimeout(resultsSkeletonTimer)
  resultsSkeletonTimer = undefined

  if (!isLoading) {
    showResultsSkeleton.value = false
    if (wasLoading) resultsAnimationKey.value++
    return
  }

  if (!import.meta.client || feed.initialLoading.value || feed.quotes.value.length === 0) return

  resultsSkeletonTimer = setTimeout(() => {
    showResultsSkeleton.value = feed.quotesLoading.value && !feed.initialLoading.value
  }, RESULTS_SKELETON_DELAY)
})

const searchInput = ref<any>(null)
const showAddQuote = ref(false)
const quoteSortOptions = computed(() => [
  { label: String($t('desktop_quotes_grid.sort_recent')), value: 'created_at' },
  { label: String($t('desktop_quotes_grid.sort_updated')), value: 'updated_at' },
  { label: String($t('desktop_quotes_grid.sort_liked')), value: 'likes_count' },
  { label: String($t('desktop_quotes_grid.sort_viewed')), value: 'views_count' },
  { label: String($t('desktop_quotes_grid.sort_shared')), value: 'shares_count' }
])

const quoteSortValues = new Set(['created_at', 'updated_at', 'likes_count', 'views_count', 'shares_count'])
const quoteLanguageValues = new Set(['all', 'en', 'fr', 'la'])
const readQueryString = (value: unknown) => typeof value === 'string' ? value : ''
const readQuotesFiltersFromRoute = () => {
  const routeSort = readQueryString(route.query.sort)
  const routeLanguage = readQueryString(route.query.lang)

  return {
    searchQuery: readQueryString(route.query.q).trim() ? readQueryString(route.query.q) : '',
    sortBy: quoteSortValues.has(routeSort) ? routeSort : 'created_at',
    sortOrder: route.query.order === 'ASC' ? 'ASC' as const : 'DESC' as const,
    language: quoteLanguageValues.has(routeLanguage) ? routeLanguage : ''
  }
}

const initialQuotesFilters = readQuotesFiltersFromRoute()
const hasActiveQuoteFilters = computed(() => Boolean(
  feed.searchQuery.value.trim() || languageStore.currentLanguageValue !== 'all'
))

const syncQuotesFiltersToRoute = async () => {
  if (!pageInitialized.value || isApplyingRouteFilters.value) return

  const query = { ...route.query }
  delete query.q
  delete query.lang
  delete query.sort
  delete query.order

  if (feed.searchQuery.value.trim()) query.q = feed.searchQuery.value
  if (languageStore.currentLanguageValue !== 'all') query.lang = languageStore.currentLanguageValue
  if (feed.selectedSortBy.value.value !== 'created_at') query.sort = feed.selectedSortBy.value.value
  if (feed.isAsc.value) query.order = 'ASC'

  const filterKeys = ['q', 'lang', 'sort', 'order'] as const
  if (filterKeys.every(key => route.query[key] === query[key])) return

  await router.replace({ path: route.path, query, hash: route.hash })
}
const debouncedSyncQuotesFiltersToRoute = useDebounceFn(syncQuotesFiltersToRoute, 250)

const syncLocalizedSortLabel = () => {
  const selected = quoteSortOptions.value.find(option => option.value === feed.selectedSortBy.value.value)
  if (selected) feed.selectedSortBy.value = selected
}

watch(quoteSortOptions, syncLocalizedSortLabel, { immediate: true })

const clearQuoteFilters = async () => {
  feed.searchQuery.value = ''
  feed.selectedSortBy.value = quoteSortOptions.value[0]!
  feed.isAsc.value = false
  await languageStore.resetToDefault()
  await feed.refresh()
}

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder="Search quotes..."]'
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

onMounted(async () => {
  const snapshot = getRestorableSnapshot()
  const hasExplicitFilterQuery = ['q', 'lang', 'sort', 'order'].some(key => route.query[key] !== undefined)

  if (initialQuotesFilters.language) {
    await languageStore.setLanguageByValue(initialQuotesFilters.language)
  }

  if (!snapshot || hasExplicitFilterQuery) {
    // Ensure we start with Most Recent (created_at desc)
    feed.searchQuery.value = initialQuotesFilters.searchQuery
    feed.selectedSortBy.value = quoteSortOptions.value.find(option => option.value === initialQuotesFilters.sortBy) ?? quoteSortOptions.value[0]!
    feed.isAsc.value = initialQuotesFilters.sortOrder === 'ASC'
  }

  await feed.init(snapshot && !hasExplicitFilterQuery ? snapshot : null)
  syncLocalizedSortLabel()
  pageInitialized.value = true
  await syncQuotesFiltersToRoute()

  if (snapshot) {
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
})

onActivated(async () => {
  await restoreFeedFromSnapshot()
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
  if (initialSkeletonTimer) clearTimeout(initialSkeletonTimer)
  if (resultsSkeletonTimer) clearTimeout(resultsSkeletonTimer)
})

watch(
  [
    () => feed.searchQuery.value,
    () => feed.selectedSortBy.value.value,
    () => feed.isAsc.value,
    () => languageStore.currentLanguageValue
  ],
  () => {
    if (!isApplyingRouteFilters.value) debouncedSyncQuotesFiltersToRoute()
  },
  { flush: 'post' }
)

watch(() => route.query, async () => {
  if (!pageInitialized.value) return

  const nextFilters = readQuotesFiltersFromRoute()
  const nextLanguage = nextFilters.language || 'all'
  const filtersChanged = nextFilters.searchQuery !== feed.searchQuery.value ||
    nextFilters.sortBy !== feed.selectedSortBy.value.value ||
    nextFilters.sortOrder !== (feed.isAsc.value ? 'ASC' : 'DESC') ||
    nextLanguage !== languageStore.currentLanguageValue

  if (!filtersChanged) return

  isApplyingRouteFilters.value = true
  feed.searchQuery.value = nextFilters.searchQuery
  feed.selectedSortBy.value = quoteSortOptions.value.find(option => option.value === nextFilters.sortBy) ?? quoteSortOptions.value[0]!
  feed.isAsc.value = nextFilters.sortOrder === 'ASC'
  await languageStore.setLanguageByValue(nextLanguage)
  await nextTick()
  isApplyingRouteFilters.value = false
  await feed.refresh()
}, { deep: true })
</script>
