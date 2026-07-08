<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        Authors
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400">
        Discover quotes from your favorite authors, both real and fictional.
      </p>
    </header>

    <div class="max-w-4xl mx-auto px-8 pb-16">
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

      <!-- Letter Navigation -->
      <div
        v-if="!searchQuery && sortBy === 'name' && dbLetters.size > 0"
        class="sticky top-14 z-3 flex items-center gap-1 bg-gray-50 dark:bg-[#0C0A09] py-3 mb-6"
      >
        <button
          v-for="letter in ALPHABET"
          :key="letter"
          @click="scrollToLetter(letter)"
          class="w-7 h-7 text-xs font-500 rounded transition-colors"
          :class="dbLetters.has(letter)
            ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            : 'text-gray-300 dark:text-gray-600 cursor-default'"
        >
          {{ letter }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-1">
        <div v-for="i in 12" :key="i" class="flex items-center gap-3 px-4 py-2.5 animate-pulse">
          <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div>
        </div>
      </div>

      <AuthorsEmptyView
        v-else-if="authors.length === 0"
        :search-query="searchQuery"
        class="mt-24"
        @clear-filters="clearFilters"
        @open-submit-modal="openSubmitModal"
      />

      <div v-else>
        <!-- Directory: grouped by first letter -->
        <template v-if="sortBy === 'name' && !searchQuery">
          <div
            v-for="(group, letter) in groupedAuthors"
            :key="letter"
            :ref="el => { if (el) letterRefs[letter] = el as HTMLElement }"
            class="mb-6"
          >
            <div class="sticky top-[106px] z-2 flex items-center gap-3 bg-gray-100 dark:bg-[#0C0A09] py-2.5 px-4 rounded-2">
              <span class="font-title text-xl font-600 text-gray-400 dark:text-gray-500">{{ letter }}</span>
              <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            <AuthorListEntry v-for="author in group" :key="author.id" :author="author" />
          </div>
        </template>

        <!-- Flat list: other sort modes or active search -->
        <template v-else>
          <div class="space-y-0.5">
            <AuthorListEntry v-for="author in authors" :key="author.id" :author="author" />
          </div>
        </template>
      </div>

      <div v-if="authors.length > 0 && hasMore" class="flex justify-center mt-8">
        <LoadMoreButton
          class="mb-4"
          idleText="Load More Authors"
          loadingText="Loading Authors..."
          :isLoading="loadingMore"
          @load="loadMore"
          data-test="load-more-authors"
        />
      </div>
    </div>

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

useHead({
  title: 'Authors - Verbatims',
  meta: [
    {
      name: 'description',
      content: 'Browse authors and discover their most inspiring quotes. From historical figures to fictional characters.',
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: 'Authors', item: 'https://verbatims.cc/authors' }
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

const scrollToLetter = async (letter: string) => {
  const el = letterRefs[letter]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

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
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Popularity', value: 'likes_count' },
  { label: 'Recently Added', value: 'created_at' }
]

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder="Search authors..."]'
})

const showSubmitModal = ref<boolean>(false)
const openSubmitModal = () => { showSubmitModal.value = true }

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

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedSaveScrollState)
  }
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedSaveScrollState, { passive: true })
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
      }

      authorsListStore.clearRestoreRequest()
    } else {
      await loadAuthors()
    }

    await nextTick()
  }

  void initializePage()
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
