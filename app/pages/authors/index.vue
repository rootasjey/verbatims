<template>
  <div class="min-h-screen">
    <header class="mx-auto max-w-6xl px-6 pb-8 pt-12 sm:px-8 md:pb-16 md:pt-28 lg:px-10">
      <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
        {{ $t('authors_title') }}
      </h1>
      <p class="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:mt-5 md:text-xl">
        {{ $t('authors_subtitle') }}
      </p>
    </header>

    <main class="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
      <div
        ref="searchToolbar"
        class="sticky top-14 z-20 mb-5 bg-[#FAFAF9]/95 pt-2 backdrop-blur-md transition-transform duration-300 ease-out dark:bg-[#0C0A09]/95 md:mb-8 md:pt-3"
        :class="searchToolbarVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)] pointer-events-none'"
      >
        <AuthorsSearch
          v-if="loading || authors.length > 0 || searchQuery"
          ref="searchInput"
          :authors-count="authors.length"
          :total-authors="totalAuthors"
          v-model:search-query="searchQuery"
          v-model:sort-by="sortBy"
          :sort-order="sortOrder"
          :sort-options="sortOptions"
          v-model:mobile-filters-open="mobileFiltersOpen"
          @toggle-sort-order="toggleSortOrder"
        />
      </div>

      <!-- Letter Navigation -->
      <div
        v-if="!searchQuery && sortBy === 'name' && dbLetters.size > 0"
        :style="{ top: `${alphabetNavTop}px` }"
        class="relative sticky z-20 mb-6 border-black/10 bg-[#FAFAF9] transition-[top] duration-300 ease-out dark:border-white/10 dark:bg-[#0C0A09] sm:mb-8"
        :class="searchToolbarVisible && !isAtPageTop ? 'border-b' : 'border-y'"
      >
        <nav
          ref="alphabetNav"
          :aria-label="$t('authors_alphabet_navigation') as string"
          class="authors-alphabet-scroll flex flex-nowrap items-center gap-1 overflow-x-auto py-3 sm:flex-wrap sm:overflow-visible"
          @scroll="updateAlphabetOverflow"
        >
          <button
            v-for="letter in ALPHABET"
            :key="letter"
            type="button"
            :aria-label="$t('authors_index_letter_label', { letter }) as string"
            :aria-busy="loadingLetter === letter"
            @click="scrollToLetter(letter)"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded font-sans text-sm font-600 text-gray-600 transition-colors hover:bg-black/8 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-gray-100 sm:h-7 sm:w-7 sm:text-xs"
          >
            <NIcon v-if="loadingLetter === letter" name="i-ph-spinner-gap" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span v-else>{{ letter }}</span>
          </button>
        </nav>
        <span
          v-if="alphabetCanScrollLeft"
          class="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#FAFAF9] to-transparent dark:from-[#0C0A09]"
          aria-hidden="true"
        />
        <span
          v-if="alphabetCanScrollRight"
          class="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#FAFAF9] to-transparent dark:from-[#0C0A09]"
          aria-hidden="true"
        />
      </div>

      <section
        aria-labelledby="authors-directory-title"
        class="rounded-2xl bg-[#e7e4dd] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]"
      >
        <h2 id="authors-directory-title" class="sr-only">{{ $t('authors_title') }}</h2>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-2" aria-busy="true" aria-live="polite">
          <div v-for="i in 10" :key="i" class="flex items-center gap-4 rounded-xl px-4 py-4 animate-pulse">
            <div class="h-10 w-10 shrink-0 rounded-lg bg-black/10 dark:bg-white/10"></div>
            <div class="min-w-0 flex-1 space-y-2">
              <div class="h-4 max-w-xs rounded bg-black/10 dark:bg-white/10"></div>
              <div class="h-3 max-w-sm rounded bg-black/10 dark:bg-white/10"></div>
            </div>
            <div class="h-3 w-16 rounded bg-black/10 dark:bg-white/10"></div>
          </div>
        </div>

        <AuthorsEmptyView
          v-else-if="authors.length === 0"
          :search-query="searchQuery"
          class="mt-16"
          @clear-filters="clearFilters"
          @open-submit-author="openSubmitAuthor"
        />

        <div v-else>
          <!-- Directory: grouped by first letter -->
          <template v-if="sortBy === 'name' && !searchQuery">
            <div
              v-for="(group, letter) in groupedAuthors"
              :key="letter"
              :ref="el => { if (el) letterRefs[letter] = el as HTMLElement }"
              class="mb-8 last:mb-0"
            >
              <div
                :style="{ top: `${groupHeadingTop}px` }"
                class="sticky z-2 flex items-center gap-3 bg-[#e7e4dd] py-3 transition-[top] duration-300 ease-out dark:bg-[#17191e]"
              >
                <button
                  type="button"
                  :aria-label="$t('authors_index_letter_label', { letter }) as string"
                  class="-my-3 flex h-12 shrink-0 items-center rounded px-2 font-serif text-2xl font-400 leading-none text-gray-700 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gray-900 dark:text-gray-200 dark:hover:bg-white/8 dark:focus-visible:outline-gray-100"
                  @click="scrollToLetter(letter)"
                >
                  {{ letter }}
                </button>
                <div class="h-px flex-1 bg-black/15 dark:bg-white/15" />
              </div>
              <div>
                <AuthorListEntry v-for="author in group" :key="author.id" :author="author" />
              </div>
            </div>
          </template>

          <!-- Flat list: other sort modes or active search -->
          <template v-else>
            <div>
              <AuthorListEntry v-for="author in authors" :key="author.id" :author="author" />
            </div>
          </template>
        </div>

        <div v-if="authors.length > 0 && hasMore" class="mt-10 flex justify-center">
          <LoadMoreButton
            class="mb-2"
            :idleText="$ts('authors_load_more')"
            :loadingText="$ts('authors_loading')"
            :isLoading="loadingMore"
            @load="loadMore"
            data-test="load-more-authors"
          />
        </div>
      </section>
    </main>

    <MobileSortAuthors
      v-if="isMobile"
      v-model:open="mobileFiltersOpen"
      v-model:sortBy="sortBy"
      :sort-order="sortOrder"
      :sort-options="sortOptions"
      @toggle-sort-order="toggleSortOrder"
    />

    <ClientOnly>
      <AddQuoteDialog v-if="!isMobile" v-model="showSubmitModal" @quote-added="showSubmitModal = false; loadAuthors()" />
      <AddQuoteDrawer v-else v-model:open="showSubmitModal" @submitted="showSubmitModal = false; loadAuthors()" />
    </ClientOnly>

    <ClientOnly>
      <AddAuthorDialog v-model="showAddAuthorModal" @author-added="showAddAuthorModal = false; loadAuthors()" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core'
import { useJsonLd } from '~/composables/useSeo'
import { useAuthorsListStore } from '~/stores/authors'
import type { AuthorsListSnapshot } from '~/stores/authors'

const { isMobile } = useMobileDetection()

const authorsListStore = useAuthorsListStore()

definePageMeta({
  layout: 'default'
})

const { $t, $ts } = useI18n()

useHead({
  title: $ts('authors_meta_title'),
  meta: [
    {
      name: 'description',
      content: $ts('authors_meta_desc'),
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: $t('authors_breadcrumb_home'), item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: $t('authors_breadcrumb'), item: 'https://verbatims.cc/authors' }
  ]
})

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

const searchQuery = ref<string>('')
const sortBy = ref<string>('name')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')
const authors: Ref<Author[]> = ref([])
const allFetchedAuthors: Ref<Author[]> = ref([])
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const totalAuthors = ref<number>(0)
const searchInput = ref<any>(null)
const searchToolbar = ref<HTMLElement | null>(null)
const alphabetNav = ref<HTMLElement | null>(null)
const searchToolbarHeight = ref(64)
const alphabetNavHeight = ref(54)
const alphabetCanScrollLeft = ref(false)
const alphabetCanScrollRight = ref(false)
const searchToolbarVisible = ref(true)
const isAtPageTop = ref(true)
const alphabetNavTop = computed(() => (searchToolbarVisible.value ? 56 + searchToolbarHeight.value : 56))
const groupHeadingTop = computed(() => alphabetNavTop.value + alphabetNavHeight.value)
const isSearching = ref(false)
const mobileFiltersOpen = ref(false)
const isRestoringState = ref(false)
const letterRefs = reactive<Record<string, HTMLElement>>({})

const groupedAuthors = computed(() => {
  const groups: Record<string, Author[]> = {}
  for (const author of authors.value) {
    const letter = (author.name.charAt(0) || '').toUpperCase()
    if (!letter || !ALPHABET.includes(letter)) continue
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(author)
  }
  return groups
})

const dbLetters = ref<Set<string>>(new Set())
const loadingLetter = ref<string | null>(null)

const scrollToLetter = async (letter: string) => {
  const el = letterRefs[letter]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  if (loadingLetter.value === letter) return

  let loadingTimer: ReturnType<typeof setTimeout> | undefined
  loadingTimer = setTimeout(() => {
    loadingLetter.value = letter
  }, 180)

  try {
    const response = await $fetch<{
      success: boolean
      data: Author[]
    }>('/api/authors', {
      query: {
        page: 1,
        limit: 100,
        starts_with: letter,
        sort_by: 'name',
        sort_order: 'ASC'
      }
    })

    const newAuthors = (response.data || []).filter(
      a => !authors.value.some(existing => existing.id === a.id)
    )
    if (newAuthors.length === 0) return

    const insertIdx = authors.value.findIndex(a => {
      const l = (a.name.charAt(0) || '').toUpperCase()
      return l > letter
    })
    if (insertIdx === -1) {
      authors.value.push(...newAuthors)
    } else {
      authors.value.splice(insertIdx, 0, ...newAuthors)
    }
    allFetchedAuthors.value.push(...newAuthors)

    await nextTick()
    letterRefs[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (error) {
    console.error(`Failed to load authors for ${letter}:`, error)
  } finally {
    if (loadingTimer) clearTimeout(loadingTimer)
    if (loadingLetter.value === letter) loadingLetter.value = null
  }
}

const saveCurrentAuthorsState = () => {
  authorsListStore.saveSnapshot({
    authors: authors.value,
    allFetchedAuthors: allFetchedAuthors.value,
    currentPage: currentPage.value,
    hasMore: hasMore.value,
    totalAuthors: totalAuthors.value,
    searchQuery: searchQuery.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    availableLetters: [...dbLetters.value]
  })
}

const debouncedSaveScrollState = useDebounceFn(() => {
  if (isRestoringState.value) return
  saveCurrentAuthorsState()
}, 100)

const sortOptions = [
  { label: $ts('authors_sort_name'), value: 'name' },
  { label: $ts('authors_sort_quote_count'), value: 'quotes_count' },
  { label: $ts('authors_sort_popularity'), value: 'likes_count' },
  { label: $ts('authors_sort_recent'), value: 'created_at' }
]

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder="' + $t('authors_search_placeholder') + '"]'
})

const showSubmitModal = ref<boolean>(false)
const openSubmitModal = () => { showSubmitModal.value = true }

const showAddAuthorModal = ref<boolean>(false)
const openSubmitAuthor = () => { showAddAuthorModal.value = true }

const clearFilters = async () => {
  searchQuery.value = ''
  await loadAuthors()
}

const restoreAuthorsState = async (snapshot: AuthorsListSnapshot) => {
  isRestoringState.value = true

  searchQuery.value = snapshot.searchQuery
  sortBy.value = snapshot.sortBy
  sortOrder.value = snapshot.sortOrder
  authors.value = [...snapshot.authors]
  allFetchedAuthors.value = [...snapshot.allFetchedAuthors]
  currentPage.value = snapshot.currentPage
  hasMore.value = snapshot.hasMore
  totalAuthors.value = snapshot.totalAuthors
  loading.value = false
  loadingMore.value = false

  if (snapshot.availableLetters) {
    dbLetters.value = new Set(snapshot.availableLetters)
  }

  await nextTick()
  isRestoringState.value = false
}

const loadAuthors = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    authors.value = []
  } else {
    loadingMore.value = true
  }

  try {
    type AuthorsApiResponse = {
      success: boolean
      data: any[]
      availableLetters?: string[]
      pagination?: { hasMore: boolean; total: number }
    }

    const response = await $fetch<AuthorsApiResponse>('/api/authors', {
      query: {
        page: currentPage.value,
        limit: 100,
        search: searchQuery.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const authorsData = response.data || []

    if (reset) {
      authors.value = authorsData
      allFetchedAuthors.value = [...authorsData]
    } else {
      authors.value.push(...authorsData)
      allFetchedAuthors.value.push(...authorsData)
    }

    hasMore.value = response.pagination?.hasMore ?? false
    totalAuthors.value = response.pagination?.total ?? 0

    if (response.availableLetters) {
      dbLetters.value = new Set(response.availableLetters)
    }
  } catch (error) {
    console.error('Failed to load authors:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadAuthors(false)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadAuthors()
}

const performSearch = async (query: string) => {
  if (!query || query.trim().length === 0) {
    await loadAuthors()
    return
  }

  isSearching.value = true
  const searchTerm = query.trim().toLowerCase()

  const localResults = allFetchedAuthors.value.filter(author =>
    author.name.toLowerCase().includes(searchTerm) ||
    (author.job && author.job.toLowerCase().includes(searchTerm)) ||
    (author.description && author.description.toLowerCase().includes(searchTerm))
  )

  authors.value = localResults

  try {
    const response = await $fetch<ApiResponse<Author[]> & { pagination?: { total?: number } }>('/api/authors', {
      query: {
        page: 1,
        limit: 50,
        search: query,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const apiResults = response?.data || []

    const existingIds = new Set(localResults.map(a => a.id))
    const newResults = apiResults.filter(author => !existingIds.has(author.id))

    authors.value = [...localResults, ...newResults]
    totalAuthors.value = response?.pagination?.total || authors.value.length
    hasMore.value = false
  } catch (error) {
    console.error('Failed to search authors:', error)
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  performSearch(searchQuery.value)
}, 300)

let lastSearchToolbarScrollY = 0
let stickyResizeObserver: ResizeObserver | undefined

const updateStickyMeasurements = () => {
  if (searchToolbar.value) {
    searchToolbarHeight.value = searchToolbar.value.getBoundingClientRect().height
  }
  if (alphabetNav.value) {
    alphabetNavHeight.value = alphabetNav.value.getBoundingClientRect().height
    updateAlphabetOverflow()
  }
}

const updateAlphabetOverflow = () => {
  if (!alphabetNav.value) {
    alphabetCanScrollLeft.value = false
    alphabetCanScrollRight.value = false
    return
  }

  const { clientWidth, scrollLeft, scrollWidth } = alphabetNav.value
  alphabetCanScrollLeft.value = scrollLeft > 1
  alphabetCanScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1
}

const handleSearchToolbarScroll = () => {
  if (typeof window === 'undefined') return

  const currentScrollY = window.scrollY
  const scrollDelta = currentScrollY - lastSearchToolbarScrollY
  const searchHasFocus = searchToolbar.value?.contains(document.activeElement)

  isAtPageTop.value = currentScrollY <= 1

  if (currentScrollY <= 80 || scrollDelta < -4 || searchHasFocus) {
    searchToolbarVisible.value = true
  } else if (scrollDelta > 4) {
    searchToolbarVisible.value = false
  }

  lastSearchToolbarScrollY = currentScrollY
}

onUnmounted(() => {
  stickyResizeObserver?.disconnect()

  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedSaveScrollState)
    window.removeEventListener('scroll', handleSearchToolbarScroll)
  }
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedSaveScrollState, { passive: true })
    lastSearchToolbarScrollY = window.scrollY
    isAtPageTop.value = window.scrollY <= 1
    window.addEventListener('scroll', handleSearchToolbarScroll, { passive: true })
  }

  const shouldRestore = authorsListStore.shouldRestore
  const storedSnapshot = authorsListStore.snapshot
  const snapshot = storedSnapshot
    ? {
        ...storedSnapshot,
        authors: [...storedSnapshot.authors],
        allFetchedAuthors: [...storedSnapshot.allFetchedAuthors]
      }
    : null

  const initializePage = async () => {
    if (shouldRestore && snapshot) {
      await restoreAuthorsState(snapshot)
      await nextTick()

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: snapshot.scrollY, behavior: 'auto' })
        lastSearchToolbarScrollY = snapshot.scrollY
        isAtPageTop.value = snapshot.scrollY <= 1
        searchToolbarVisible.value = snapshot.scrollY <= 80
      }

      authorsListStore.clearRestoreRequest()
    } else {
      await loadAuthors()
    }

    await nextTick()
    updateStickyMeasurements()

    if (typeof ResizeObserver !== 'undefined') {
      stickyResizeObserver = new ResizeObserver(updateStickyMeasurements)
      if (searchToolbar.value) stickyResizeObserver.observe(searchToolbar.value)
      if (alphabetNav.value) stickyResizeObserver.observe(alphabetNav.value)
    }
  }

  void initializePage()
})

watch([sortBy, searchQuery], async () => {
  await nextTick()
  updateStickyMeasurements()
})

onBeforeRouteLeave((to) => {
  if (typeof window === 'undefined') return

  saveCurrentAuthorsState()

  if (to.path.startsWith('/authors/')) {
    authorsListStore.requestRestore()
  } else {
    authorsListStore.clearRestoreRequest()
  }
})

watch([sortBy], () => {
  if (isRestoringState.value) return

  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadAuthors()
  }
})

watch(searchQuery, (newQuery) => {
  if (isRestoringState.value) return

  if (!newQuery || newQuery.trim().length === 0) {
    loadAuthors()
    return
  }

  debouncedSearch()
})

watch(
  [authors, allFetchedAuthors, currentPage, hasMore, totalAuthors, searchQuery, sortBy, sortOrder],
  () => {
    if (isRestoringState.value) return
    saveCurrentAuthorsState()
  },
  { deep: true }
)
</script>

<style scoped>
.authors-alphabet-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.authors-alphabet-scroll::-webkit-scrollbar {
  display: none;
}
</style>
