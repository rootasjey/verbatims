<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        References
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400">
        Explore the sources behind your favorite quotes, from books and films to speeches and more.
      </p>
    </header>

    <div class="max-w-4xl mx-auto px-8 pb-16">
      <ReferencesSearch
        ref="searchInput"
        :visible-count="references.length"
        :total-count="totalReferences || 0"
        v-model:search-query="searchQuery"
        v-model:primary-type="primaryType"
        v-model:sort-by="sortBy"
        :sort-order="sortOrder"
        :type-options="typeOptions"
        :sort-options="sortOptions"
        @toggle-sort-order="toggleSortOrder"
        @open-mobile-filters="mobileFiltersOpen = true"
      />

      <!-- Letter Navigation -->
      <div
        v-if="!searchQuery && !primaryType && sortBy === 'name' && references.length > 0"
        class="sticky top-14 z-3 flex items-center gap-1 bg-gray-50 dark:bg-[#0C0A09] py-3 mb-6"
      >
        <button
          v-for="letter in ALPHABET"
          :key="letter"
          @click="scrollToLetter(letter)"
          class="w-7 h-7 text-xs font-500 rounded transition-colors"
          :class="availableLetters.has(letter)
            ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            : 'text-gray-300 dark:text-gray-600 cursor-default'"
        >
          {{ letter }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-1">
        <div v-for="i in 12" :key="i" class="flex items-center gap-3 px-4 py-2.5 animate-pulse">
          <div class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div>
        </div>
      </div>

      <ReferencesEmptyView
        v-else-if="references.length === 0"
        :search-query="searchQuery"
        :selected-type="primaryType"
        class="mt-24"
        @clear-filters="clearFilters"
        @open-submit-modal="openSubmitModal"
      />

      <div v-else>
        <!-- Directory: grouped by first letter -->
        <template v-if="sortBy === 'name' && !searchQuery && !primaryType">
          <div
            v-for="(group, letter) in groupedReferences"
            :key="letter"
            :ref="el => { if (el) letterRefs[letter] = el as HTMLElement }"
            class="mb-6"
          >
            <div class="sticky top-[106px] z-2 flex items-center gap-3 bg-gray-100 dark:bg-[#0C0A09] py-2.5 px-4 rounded-2">
              <span class="font-title text-xl font-600 text-gray-400 dark:text-gray-500">{{ letter }}</span>
              <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            <ReferenceListEntry v-for="reference in group" :key="reference.id" :reference="reference" />
          </div>
        </template>

        <!-- Flat list: other sort modes or active search/type filter -->
        <template v-else>
          <div class="space-y-0.5">
            <ReferenceListEntry v-for="reference in references" :key="reference.id" :reference="reference" />
          </div>
        </template>
      </div>

      <div v-if="references.length > 0 && hasMore" class="flex justify-center mt-8">
        <LoadMoreButton
          class="mb-4"
          idleText="Load More References"
          loadingText="Loading References..."
          :isLoading="loadingMore"
          @load="loadMore"
        />
      </div>
    </div>

    <MobileSortReferences
      v-if="isMobile"
      v-model:open="mobileFiltersOpen"
      v-model:sortBy="sortBy"
      v-model:primaryType="primaryType"
      :sort-order="sortOrder"
      :sort-options="sortOptions"
      :type-options="typeOptions"
      @toggle-sort-order="toggleSortOrder"
    />
  </div>
</template>

<script lang="ts" setup>
import { useMobileDetection, useLayoutSwitching } from '~/composables/useMobileDetection'
import { useDebounceFn } from '@vueuse/core'
import { useReferencesListStore } from '~/stores/references'
import { useJsonLd } from '~/composables/useSeo'
import type { ReferencesListSnapshot } from '~/stores/references'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const hydrated = ref(false)

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

const referencesListStore = useReferencesListStore()

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'References - Verbatims',
  meta: [
    {
      name: 'description',
      content: 'Browse quote references and discover the sources behind inspiring quotes. From books and films to speeches and more.',
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: 'References', item: 'https://verbatims.cc/references' }
  ]
})

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

const searchQuery = ref<string>('')
const primaryType = ref<string>('')
const sortBy = ref<string>('name')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')
const references = ref<QuoteReferenceWithMetadata[]>([])
const allFetchedReferences = ref<QuoteReferenceWithMetadata[]>([])
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const showSubmitModal = ref<boolean>(false)
const totalReferences = ref<number>(0)
const searchInput = ref<any>(null)
const isSearching = ref<boolean>(false)
const mobileFiltersOpen = ref<boolean>(false)
const isProgrammaticReset = ref<boolean>(false)
const isRestoringState = ref<boolean>(false)
const letterRefs = reactive<Record<string, HTMLElement>>({})

const groupedReferences = computed(() => {
  const groups: Record<string, QuoteReferenceWithMetadata[]> = {}
  for (const ref of references.value) {
    const letter = (ref.name.charAt(0) || '').toUpperCase()
    if (!letter || !ALPHABET.includes(letter)) continue
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(ref)
  }
  return groups
})

const availableLetters = computed(() => new Set(Object.keys(groupedReferences.value)))

const scrollToLetter = (letter: string) => {
  const el = letterRefs[letter]
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const saveCurrentReferencesState = () => {
  referencesListStore.saveSnapshot({
    references: references.value,
    allFetchedReferences: allFetchedReferences.value,
    currentPage: currentPage.value,
    hasMore: hasMore.value,
    totalReferences: totalReferences.value,
    searchQuery: searchQuery.value,
    primaryType: primaryType.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0
  })
}

const restoreReferencesState = async (snapshot: ReferencesListSnapshot) => {
  isRestoringState.value = true

  searchQuery.value = snapshot.searchQuery
  primaryType.value = snapshot.primaryType
  sortBy.value = snapshot.sortBy
  sortOrder.value = snapshot.sortOrder
  references.value = [...snapshot.references]
  allFetchedReferences.value = [...snapshot.allFetchedReferences]
  currentPage.value = snapshot.currentPage
  hasMore.value = snapshot.hasMore
  totalReferences.value = snapshot.totalReferences
  loading.value = false
  loadingMore.value = false

  await nextTick()
  isRestoringState.value = false
}

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder*="Search"]'
})

type Option = { label: string; value: string }

const typeOptions: Option[] = [
  { label: 'All Types', value: '' },
  { label: 'Books', value: 'book' },
  { label: 'Films', value: 'film' },
  { label: 'TV Series', value: 'tv_series' },
  { label: 'Music', value: 'music' },
  { label: 'Speeches', value: 'speech' },
  { label: 'Podcasts', value: 'podcast' },
  { label: 'Interviews', value: 'interview' },
  { label: 'Documentaries', value: 'documentary' },
  { label: 'Media Streams', value: 'media_stream' },
  { label: 'Writings', value: 'writings' },
  { label: 'Video Games', value: 'video_game' },
  { label: 'Other', value: 'other' }
]

const sortOptions: Option[] = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Popularity', value: 'likes_count' },
  { label: 'Release Date', value: 'release_date' },
  { label: 'Recently Added', value: 'created_at' }
]

const loadReferences = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    references.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response: any = await $fetch('/api/references', {
      query: {
        page: currentPage.value,
        limit: 100,
        search: searchQuery.value || undefined,
        primary_type: primaryType.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const referencesData = Array.isArray(response.data) ? response.data : []

    if (reset) {
      references.value = referencesData
      allFetchedReferences.value = [...referencesData]
    } else {
      references.value = [...references.value, ...referencesData]
      allFetchedReferences.value = [...allFetchedReferences.value, ...referencesData]
    }

    const paginationInfo = response.pagination || {}

    hasMore.value = paginationInfo.hasMore || false
    totalReferences.value = paginationInfo.total || 0
  } catch (error) {
    console.error('Failed to load references:', error)
    if (reset) {
      references.value = []
      allFetchedReferences.value = []
    }

    hasMore.value = false
    totalReferences.value = 0
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadReferences(false)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadReferences()
}

const performSearch = async (query: string) => {
  if (!query || query.trim().length === 0) {
    if (allFetchedReferences.value.length > 0) {
      references.value = [...allFetchedReferences.value]
      totalReferences.value = allFetchedReferences.value.length
      hasMore.value = allFetchedReferences.value.length >= 20
    } else {
      await loadReferences()
    }
    return
  }

  isSearching.value = true
  const searchTerm = query.trim().toLowerCase()

  const localResults = allFetchedReferences.value.filter(reference =>
    reference.name.toLowerCase().includes(searchTerm) ||
    (reference.description && reference.description.toLowerCase().includes(searchTerm)) ||
    (reference.secondary_type && reference.secondary_type.toLowerCase().includes(searchTerm))
  )

  references.value = localResults

  try {
    const response: any = await $fetch('/api/references', {
      query: {
        page: 1,
        limit: 50,
        search: query,
        primary_type: primaryType.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const apiResults = Array.isArray(response.data?.results) ? response.data.results :
      Array.isArray(response.data) ? response.data : []

    const existingIds = new Set(localResults.map((r) => r.id))
    const newResults = apiResults.filter((reference: QuoteReferenceWithMetadata) => !existingIds.has(reference.id))

    references.value = [...localResults, ...newResults]
    totalReferences.value = response.pagination?.total || references.value.length
    hasMore.value = false
  } catch (error) {
    console.error('Failed to search references:', error)
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  performSearch(searchQuery.value)
}, 300)

const openSubmitModal = () => {
  showSubmitModal.value = true
}

const clearFilters = async () => {
  isProgrammaticReset.value = true
  searchQuery.value = ''
  primaryType.value = ''
  await loadReferences()
  isProgrammaticReset.value = false
}

const navigateToReference = (referenceId: number | string) => {
  navigateTo(`/references/${referenceId}`)
}

const focusSearchInput = () => {
  nextTick(() => {
    const el = searchInput.value?.$el || searchInput.value
    const input = el?.querySelector?.('input')
    if (input && typeof input.focus === 'function') input.focus()
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', saveCurrentReferencesState, { passive: true })
  }

  const shouldRestore = referencesListStore.shouldRestore
  const storedSnapshot = referencesListStore.snapshot
  const snapshot = storedSnapshot
    ? {
        ...storedSnapshot,
        references: [...storedSnapshot.references],
        allFetchedReferences: [...storedSnapshot.allFetchedReferences]
      }
    : null

  const initializePage = async () => {
    if (shouldRestore && snapshot) {
      await restoreReferencesState(snapshot)

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: snapshot.scrollY, behavior: 'auto' })
      }

      referencesListStore.clearRestoreRequest()
    } else {
      await loadReferences()
    }

    await nextTick()
  }

  void initializePage()
})

onBeforeRouteLeave((to) => {
  if (typeof window === 'undefined') return

  saveCurrentReferencesState()

  if (to.path.startsWith('/references/')) {
    referencesListStore.requestRestore()
  } else {
    referencesListStore.clearRestoreRequest()
  }
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', saveCurrentReferencesState)
  }
})

watch([sortBy, primaryType], () => {
  if (isRestoringState.value) return
  if (isProgrammaticReset.value) return

  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadReferences()
  }
})

watch(searchQuery, (newQuery) => {
  if (isRestoringState.value) return
  if (isProgrammaticReset.value) return

  debouncedSearch()
})
</script>
