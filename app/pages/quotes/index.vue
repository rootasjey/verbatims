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
const quotesFeedStore = useQuotesFeedStore()
const restoreSourcePath = '/quotes'
let removeScrollListener: (() => void) | null = null
const lastKnownScrollY = ref(0)

definePageMeta({
  layout: false,
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

const feed = useQuoteSearchFeed()

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

onMounted(async () => {
  setPageLayout(currentLayout.value)

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

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

onUnmounted(() => {
  removeScrollListener?.()
})
</script>
