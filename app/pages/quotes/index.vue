<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        Quotes
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400">
        Browse the latest quotes added by the community.
      </p>
    </header>

    <!-- Content -->
    <div class="pb-16">
      <!-- Desktop grid with search/sort -->
      <DesktopQuotesGrid v-if="!isMobile" ref="searchInput" :feed="feed" />

      <!-- Mobile: list like MobileRecentQuotes -->
      <MobileRecentQuotes v-else :feed="feed" />
    </div>
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

useHead({
  title: 'Quotes - Verbatims',
  meta: [
    {
      name: 'description',
      content: 'Discover the most recently added quotes on Verbatims.'
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: 'Quotes', item: 'https://verbatims.cc/quotes' }
  ]
})

const feed = useQuoteSearchFeed()
const searchInput = ref<any>(null)

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

  if (!snapshot) {
    // Ensure we start with Most Recent (created_at desc)
    feed.selectedSortBy.value = { label: 'Most Recent', value: 'created_at' }
    feed.isAsc.value = false
  }

  await feed.init(snapshot)

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
})
</script>
