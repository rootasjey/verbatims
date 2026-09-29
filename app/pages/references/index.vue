<template>
  <div class="min-h-screen">
    <header class="mx-auto max-w-6xl px-6 pb-8 pt-12 sm:px-8 md:pb-16 md:pt-28 lg:px-10">
      <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
        {{ $t('references_title') }}
      </h1>
      <p class="mt-4 max-w-3xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:mt-5 md:text-xl">
        {{ $t('references_subtitle') }}
      </p>
    </header>

    <main class="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
      <div
        ref="searchToolbar"
        class="sticky top-14 z-20 mb-5 bg-[#FAFAF9]/95 pt-2 backdrop-blur-md transition-transform duration-300 ease-out dark:bg-[#0C0A09]/95 md:mb-8 md:pt-3"
        :class="searchToolbarVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)] pointer-events-none'"
      >
        <ReferencesSearch
          v-if="loading || references.length > 0 || searchQuery || primaryType"
          ref="searchInput"
          :visible-count="references.length"
          :show-result-count="showReferenceResultCount"
          v-model:search-query="searchQuery"
          v-model:primary-type="primaryType"
          v-model:sort-by="sortBy"
          :sort-order="sortOrder"
          :type-options="typeOptions"
          :sort-options="sortOptions"
          v-model:mobile-filters-open="mobileFiltersOpen"
          @toggle-sort-order="toggleSortOrder"
        />
      </div>

      <!-- Letter Navigation -->
      <div
        v-if="!renderedSearchQuery && renderedSortBy === 'name' && dbLetters.size > 0"
        :style="{ top: `${alphabetNavTop}px` }"
        class="relative sticky z-20 mb-6 border-black/10 bg-[#FAFAF9] transition-[top] duration-300 ease-out dark:border-white/10 dark:bg-[#0C0A09] sm:mb-8"
        :class="searchToolbarVisible && !isAtPageTop ? 'border-b' : 'border-y'"
      >
        <nav
          ref="alphabetNav"
          :aria-label="$t('references_alphabet_navigation') as string"
          class="references-alphabet-scroll flex flex-nowrap items-center gap-1 overflow-x-auto py-3 sm:flex-wrap sm:overflow-visible"
          @scroll="updateAlphabetOverflow"
        >
          <NTooltip
            v-for="letter in ALPHABET"
            :key="letter"
            :content="emptyLetterTooltipContent as string"
            :open="emptyLetterTooltip?.letter === letter"
            :disabled="emptyLetterTooltip?.letter !== letter"
            :delay-duration="0"
            :_tooltip-content="{ side: 'bottom' }"
          >
            <button
              type="button"
              :aria-label="$t('references_index_letter_label', { letter }) as string"
              :aria-busy="loadingLetter === letter"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded font-sans text-sm font-600 text-gray-600 transition-colors hover:bg-black/8 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-gray-100 sm:h-7 sm:w-7 sm:text-xs"
              @click="scrollToLetter(letter)"
            >
              <NIcon v-if="loadingLetter === letter" name="i-ph-spinner-gap" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span v-else>{{ letter }}</span>
            </button>
          </NTooltip>
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
        aria-labelledby="references-directory-title"
        class="rounded-2xl bg-[#e7e4dd] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]"
      >
        <h2 id="references-directory-title" class="sr-only">{{ $t('references_title') }}</h2>

        <div
          ref="referencesResultsShell"
          class="references-results-shell"
          :aria-busy="loading || isSearching"
          aria-live="polite"
        >
          <div ref="referencesResultsContent">
            <!-- Loading State: only shown when the first request is actually slow. -->
            <div v-if="showReferencesSkeleton" class="space-y-2" aria-busy="true">
              <div v-for="i in 10" :key="i" class="flex items-center gap-4 rounded-xl px-4 py-4 animate-pulse">
                <div class="h-10 w-10 shrink-0 rounded-lg bg-black/10 dark:bg-white/10"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-4 max-w-xs rounded bg-black/10 dark:bg-white/10"></div>
                  <div class="h-3 max-w-sm rounded bg-black/10 dark:bg-white/10"></div>
                </div>
                <div class="h-3 w-16 rounded bg-black/10 dark:bg-white/10"></div>
              </div>
            </div>

            <ReferencesEmptyView
              v-else-if="!loading && references.length === 0"
              :search-query="searchQuery"
              :selected-type="primaryType"
              class="mt-16"
              @clear-filters="clearFilters"
              @open-submit-reference="openSubmitReference"
            />

            <div v-else-if="references.length > 0">
              <!-- Directory: grouped by first letter -->
              <template v-if="renderedSortBy === 'name' && !renderedSearchQuery">
                <div
                  v-for="(group, letter) in groupedReferences"
                  :key="letter"
                  :ref="el => {
                    if (el) letterRefs[letter] = el as HTMLElement
                    else delete letterRefs[letter]
                  }"
                  class="mb-8 last:mb-0"
                >
                  <div
                    :style="{ top: `${groupHeadingTop}px` }"
                    class="sticky z-2 flex items-center gap-3 bg-[#e7e4dd] py-3 transition-[top] duration-300 ease-out dark:bg-[#17191e]"
                  >
                    <button
                      type="button"
                      :aria-label="$t('references_index_letter_label', { letter }) as string"
                      class="-my-3 flex h-12 shrink-0 items-center rounded px-2 font-serif text-2xl font-400 leading-none text-gray-700 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gray-900 dark:text-gray-200 dark:hover:bg-white/8 dark:focus-visible:outline-gray-100"
                      @click="scrollToLetter(letter)"
                    >
                      {{ letter }}
                    </button>
                    <div class="h-px flex-1 bg-black/15 dark:bg-white/15" />
                  </div>
                  <TransitionGroup name="references-list" tag="div" class="relative" appear>
                    <ReferenceListEntry
                      v-for="(reference, index) in group"
                      :key="`${resultsAnimationKey}-${reference.id}`"
                      :reference="reference"
                      :style="{ '--reference-entry-delay': `${Math.min(index, 8) * 18}ms` }"
                    />
                  </TransitionGroup>
                </div>
              </template>

              <!-- Flat list: other sort modes or active search -->
              <template v-else>
                <TransitionGroup name="references-list" tag="div" class="relative" appear>
                  <ReferenceListEntry
                    v-for="(reference, index) in references"
                    :key="`${resultsAnimationKey}-${reference.id}`"
                    :reference="reference"
                    :style="{ '--reference-entry-delay': `${Math.min(index, 8) * 18}ms` }"
                  />
                </TransitionGroup>
              </template>
            </div>
          </div>
        </div>

        <div v-if="references.length > 0 && hasMore" class="mt-10 flex justify-center">
          <LoadMoreButton
            class="mb-2"
            :idleText="$ts('references_load_more')"
            :loadingText="$ts('references_loading')"
            :isLoading="loadingMore"
            @load="loadMore"
          />
        </div>
      </section>
    </main>

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

    <ClientOnly>
      <AddQuoteDialog v-if="!isMobile" v-model="showSubmitModal" @quote-added="loadReferences()" />
      <AddQuoteDrawer v-else v-model:open="showSubmitModal" @submitted="loadReferences()" />
    </ClientOnly>

    <ClientOnly>
      <AddReferenceDialog v-model="showAddReferenceModal" @reference-added="showAddReferenceModal = false; loadReferences()" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, reactive } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useReferencesListStore } from '~/stores/references'
import { useJsonLd } from '~/composables/useSeo'
import type { ReferencesListSnapshot } from '~/stores/references'

const { isMobile } = useMobileDetection()

const referencesListStore = useReferencesListStore()

definePageMeta({
  layout: 'default'
})

const { $t, $ts } = useI18n()

useHead({
  title: $ts('references_meta_title'),
  meta: [
    {
      name: 'description',
      content: $ts('references_meta_desc'),
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: $t('references_breadcrumb_home'), item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: $t('references_breadcrumb'), item: 'https://verbatims.cc/references' }
  ]
})

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const route = useRoute()
const router = useRouter()
type DebouncedAction = (() => void) & { cancel: () => void }
const createDebouncedAction = (action: () => void | Promise<void>, delay: number): DebouncedAction => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = (() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      void action()
    }, delay)
  }) as DebouncedAction

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  return debounced
}
const referenceSortValues = new Set(['name', 'quotes_count', 'likes_count', 'release_date', 'created_at'])
const referenceTypeValues = new Set([
  'book', 'film', 'tv_series', 'music', 'speech', 'podcast', 'interview',
  'documentary', 'media_stream', 'writings', 'video_game', 'other'
])
const readQueryString = (value: unknown) => typeof value === 'string' ? value : ''
const readReferencesFiltersFromRoute = () => {
  const routeSortBy = readQueryString(route.query.sort)
  const routeType = readQueryString(route.query.type)
  const routeSearchQuery = readQueryString(route.query.q)

  return {
    searchQuery: routeSearchQuery.trim() ? routeSearchQuery : '',
    primaryType: referenceTypeValues.has(routeType) ? routeType : '',
    sortBy: referenceSortValues.has(routeSortBy) ? routeSortBy : 'name',
    sortOrder: route.query.order === 'DESC' ? 'DESC' as const : 'ASC' as const
  }
}
const initialReferencesFilters = readReferencesFiltersFromRoute()

const searchQuery = ref<string>(initialReferencesFilters.searchQuery)
const primaryType = ref<string>(initialReferencesFilters.primaryType)
const sortBy = ref<string>(initialReferencesFilters.sortBy)
const renderedSearchQuery = ref<string>('')
const renderedPrimaryType = ref<string>('')
const renderedSortBy = ref<string>('name')
const sortOrder = ref<'ASC' | 'DESC'>(initialReferencesFilters.sortOrder)
const references = ref<QuoteReferenceWithMetadata[]>([])
const allFetchedReferences = ref<QuoteReferenceWithMetadata[]>([])
const loading = ref<boolean>(true)
const showReferencesSkeleton = ref(false)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const showSubmitModal = ref<boolean>(false)
const totalReferences = ref<number>(0)
const searchInput = ref<any>(null)
const searchToolbar = ref<HTMLElement | null>(null)
const alphabetNav = ref<HTMLElement | null>(null)
const referencesResultsShell = ref<HTMLElement | null>(null)
const referencesResultsContent = ref<HTMLElement | null>(null)
const searchToolbarHeight = ref(64)
const alphabetNavHeight = ref(54)
const alphabetCanScrollLeft = ref(false)
const alphabetCanScrollRight = ref(false)
const searchToolbarVisible = ref(true)
const isAtPageTop = ref(true)
const alphabetNavTop = computed(() => (searchToolbarVisible.value ? 56 + searchToolbarHeight.value : 56))
const groupHeadingTop = computed(() => alphabetNavTop.value + alphabetNavHeight.value)
const isSearching = ref<boolean>(false)
const showReferenceResultCount = computed(() => {
  const hasActiveFilters = Boolean(searchQuery.value.trim() || primaryType.value)
  const searchIsCurrent = searchQuery.value.trim() === renderedSearchQuery.value.trim()
  const typeIsCurrent = primaryType.value === renderedPrimaryType.value

  return hasActiveFilters && !loading.value && !isSearching.value && searchIsCurrent && typeIsCurrent
})
const mobileFiltersOpen = ref<boolean>(false)
const isProgrammaticReset = ref<boolean>(false)
const isRestoringState = ref<boolean>(false)
const isApplyingRouteFilters = ref<boolean>(false)
const letterRefs = reactive<Record<string, HTMLElement>>({})
const resultsAnimationKey = ref(0)

const REFERENCES_LOADING_DELAY = 180
const REFERENCES_RESULTS_TRANSITION = 360
let referencesLoadingTimer: ReturnType<typeof setTimeout> | undefined
let referencesResultsHeightTimer: ReturnType<typeof setTimeout> | undefined
let referencesResultsHeightFrame: number | undefined

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

const dbLetters = ref<Set<string>>(new Set())
const loadingLetter = ref<string | null>(null)
const emptyLetterTooltip = ref<{ letter: string; type: string } | null>(null)
const emptyLetterTooltipContent = computed(() => {
  if (!emptyLetterTooltip.value) return ''

  const { letter, type } = emptyLetterTooltip.value
  if (!type) return String($t('references_empty_letter', { letter }))

  return String($t('references_empty_letter_in_type', {
    letter,
    type: String($t(`reference_types.${type}`))
  }))
})
let emptyLetterTooltipTimer: ReturnType<typeof setTimeout> | undefined

const dismissEmptyLetterTooltip = () => {
  if (emptyLetterTooltipTimer) {
    clearTimeout(emptyLetterTooltipTimer)
    emptyLetterTooltipTimer = undefined
  }
  emptyLetterTooltip.value = null
}

const showEmptyLetterTooltip = (letter: string, type: string) => {
  dismissEmptyLetterTooltip()
  emptyLetterTooltip.value = { letter, type }
  emptyLetterTooltipTimer = setTimeout(() => {
    emptyLetterTooltip.value = null
    emptyLetterTooltipTimer = undefined
  }, 2400)
}

const scrollToLetter = async (letter: string) => {
  dismissEmptyLetterTooltip()

  const el = letterRefs[letter]
  if (el?.isConnected) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  delete letterRefs[letter]

  if (loadingLetter.value === letter) return

  const requestedType = renderedPrimaryType.value
  if (!dbLetters.value.has(letter)) {
    showEmptyLetterTooltip(letter, requestedType)
    return
  }

  let loadingTimer: ReturnType<typeof setTimeout> | undefined
  loadingTimer = setTimeout(() => {
    loadingLetter.value = letter
  }, 180)

  try {
    const response: any = await $fetch('/api/references', {
      query: {
        page: 1,
        limit: 100,
        starts_with: letter,
        primary_type: requestedType || undefined,
        sort_by: 'name',
        sort_order: 'ASC'
      }
    })

    if (
      renderedPrimaryType.value !== requestedType ||
      renderedSearchQuery.value ||
      renderedSortBy.value !== 'name'
    ) return

    const newRefs = (Array.isArray(response.data) ? response.data : []).filter(
      (r: QuoteReferenceWithMetadata) => !references.value.some(existing => existing.id === r.id)
    )
    if (newRefs.length === 0) {
      showEmptyLetterTooltip(letter, requestedType)
      return
    }

    const insertIdx = references.value.findIndex(r => {
      const l = (r.name.charAt(0) || '').toUpperCase()
      return l > letter
    })
    if (insertIdx === -1) {
      references.value.push(...newRefs)
    } else {
      references.value.splice(insertIdx, 0, ...newRefs)
    }
    allFetchedReferences.value.push(...newRefs)

    await nextTick()
    letterRefs[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (error) {
    console.error(`Failed to load references for ${letter}:`, error)
  } finally {
    if (loadingTimer) clearTimeout(loadingTimer)
    if (loadingLetter.value === letter) loadingLetter.value = null
  }
}

const stopReferencesLoadingFeedback = () => {
  if (referencesLoadingTimer) {
    clearTimeout(referencesLoadingTimer)
    referencesLoadingTimer = undefined
  }
  showReferencesSkeleton.value = false
}

const animateReferencesResultsHeight = async () => {
  await nextTick()

  const shell = referencesResultsShell.value
  if (!shell) return

  if (referencesResultsHeightFrame !== undefined && typeof window !== 'undefined') {
    window.cancelAnimationFrame(referencesResultsHeightFrame)
    referencesResultsHeightFrame = undefined
  }
  if (referencesResultsHeightTimer) {
    clearTimeout(referencesResultsHeightTimer)
    referencesResultsHeightTimer = undefined
  }

  const fromHeight = shell.getBoundingClientRect().height
  shell.style.gridTemplateRows = 'auto'
  const targetHeight = referencesResultsContent.value?.scrollHeight ?? shell.scrollHeight

  if (Math.abs(fromHeight - targetHeight) < 1) {
    shell.style.gridTemplateRows = 'auto'
    return
  }

  shell.style.gridTemplateRows = `${fromHeight}px`

  if (typeof window === 'undefined') {
    shell.style.gridTemplateRows = 'auto'
    return
  }

  referencesResultsHeightFrame = window.requestAnimationFrame(() => {
    referencesResultsHeightFrame = undefined
    if (referencesResultsShell.value) {
      referencesResultsShell.value.style.gridTemplateRows = `${targetHeight}px`
    }
  })

  referencesResultsHeightTimer = setTimeout(() => {
    if (referencesResultsShell.value) {
      referencesResultsShell.value.style.gridTemplateRows = 'auto'
    }
    referencesResultsHeightTimer = undefined
  }, REFERENCES_RESULTS_TRANSITION)
}

const freezeReferencesResultsHeight = () => {
  const shell = referencesResultsShell.value
  if (!shell) return

  if (referencesResultsHeightFrame !== undefined && typeof window !== 'undefined') {
    window.cancelAnimationFrame(referencesResultsHeightFrame)
    referencesResultsHeightFrame = undefined
  }
  if (referencesResultsHeightTimer) {
    clearTimeout(referencesResultsHeightTimer)
    referencesResultsHeightTimer = undefined
  }

  const currentHeight = shell.getBoundingClientRect().height
  if (currentHeight > 0) {
    shell.style.gridTemplateRows = `${currentHeight}px`
  }
}

const startReferencesLoadingFeedback = () => {
  stopReferencesLoadingFeedback()

  referencesLoadingTimer = setTimeout(() => {
    referencesLoadingTimer = undefined
    if (!loading.value || references.value.length > 0) return

    showReferencesSkeleton.value = true
    void animateReferencesResultsHeight()
  }, REFERENCES_LOADING_DELAY)
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
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    availableLetters: [...dbLetters.value]
  })
}

const restoreReferencesState = async (snapshot: ReferencesListSnapshot) => {
  isRestoringState.value = true

  searchQuery.value = snapshot.searchQuery
  primaryType.value = snapshot.primaryType
  sortBy.value = snapshot.sortBy
  renderedSearchQuery.value = snapshot.searchQuery
  renderedPrimaryType.value = snapshot.primaryType
  renderedSortBy.value = snapshot.sortBy
  sortOrder.value = snapshot.sortOrder
  references.value = [...snapshot.references]
  allFetchedReferences.value = [...snapshot.allFetchedReferences]
  currentPage.value = snapshot.currentPage
  hasMore.value = snapshot.hasMore
  totalReferences.value = snapshot.totalReferences
  loading.value = false
  stopReferencesLoadingFeedback()
  loadingMore.value = false

  if (snapshot.availableLetters) {
    dbLetters.value = new Set(snapshot.availableLetters)
  }

  await nextTick()
  isRestoringState.value = false
}

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder*="Search"]'
})

type Option = { label: string; value: string }

const typeOptions: Option[] = [
  { label: $ts('reference_types.all'), value: '' },
  { label: $ts('reference_types.book'), value: 'book' },
  { label: $ts('reference_types.film'), value: 'film' },
  { label: $ts('reference_types.tv_series'), value: 'tv_series' },
  { label: $ts('reference_types.music'), value: 'music' },
  { label: $ts('reference_types.speech'), value: 'speech' },
  { label: $ts('reference_types.podcast'), value: 'podcast' },
  { label: $ts('reference_types.interview'), value: 'interview' },
  { label: $ts('reference_types.documentary'), value: 'documentary' },
  { label: $ts('reference_types.media_stream'), value: 'media_stream' },
  { label: $ts('reference_types.writings'), value: 'writings' },
  { label: $ts('reference_types.video_game'), value: 'video_game' },
  { label: $ts('reference_types.other'), value: 'other' }
]

const sortOptions: Option[] = [
  { label: $ts('references_sort_name'), value: 'name' },
  { label: $ts('references_sort_quote_count'), value: 'quotes_count' },
  { label: $ts('references_sort_popularity'), value: 'likes_count' },
  { label: $ts('references_sort_release_date'), value: 'release_date' },
  { label: $ts('references_sort_recent'), value: 'created_at' }
]

const syncReferencesFiltersToRoute = async () => {
  if (isRestoringState.value || isApplyingRouteFilters.value) return

  const query = { ...route.query }
  delete query.q
  delete query.type
  delete query.sort
  delete query.order

  if (searchQuery.value.trim()) query.q = searchQuery.value
  if (primaryType.value) query.type = primaryType.value
  if (sortBy.value !== 'name') query.sort = sortBy.value
  if (sortOrder.value !== 'ASC') query.order = sortOrder.value

  const filterKeys = ['q', 'type', 'sort', 'order'] as const
  if (filterKeys.every(key => route.query[key] === query[key])) return

  await router.replace({ path: route.path, query, hash: route.hash })
}
const debouncedSyncReferencesFiltersToRoute = createDebouncedAction(syncReferencesFiltersToRoute, 250)

const loadReferences = async (reset = true) => {
  if (reset) {
    freezeReferencesResultsHeight()
    loading.value = true
    startReferencesLoadingFeedback()
    currentPage.value = 1
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
      renderedSearchQuery.value = searchQuery.value
      renderedPrimaryType.value = primaryType.value
      renderedSortBy.value = sortBy.value
      resultsAnimationKey.value++
    } else {
      references.value = [...references.value, ...referencesData]
      allFetchedReferences.value = [...allFetchedReferences.value, ...referencesData]
    }

    const paginationInfo = response.pagination || {}

    hasMore.value = paginationInfo.hasMore || false
    totalReferences.value = paginationInfo.total || 0

    if (response.availableLetters) {
      dbLetters.value = new Set(response.availableLetters)
    }
  } catch (error) {
    console.error('Failed to load references:', error)
    if (reset && references.value.length === 0) {
      hasMore.value = false
      totalReferences.value = 0
    }
  } finally {
    loading.value = false
    if (reset) {
      stopReferencesLoadingFeedback()
      await animateReferencesResultsHeight()
    }
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
      renderedSearchQuery.value = ''
      renderedPrimaryType.value = primaryType.value
      renderedSortBy.value = sortBy.value
      resultsAnimationKey.value++
      await animateReferencesResultsHeight()
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

  renderedSearchQuery.value = query
  renderedPrimaryType.value = primaryType.value
  renderedSortBy.value = sortBy.value
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
    resultsAnimationKey.value++
  } catch (error) {
    console.error('Failed to search references:', error)
  } finally {
    isSearching.value = false
    await animateReferencesResultsHeight()
  }
}

const debouncedSearch = createDebouncedAction(() => {
  performSearch(searchQuery.value)
}, 300)

const openSubmitModal = () => {
  showSubmitModal.value = true
}

const showAddReferenceModal = ref<boolean>(false)
const openSubmitReference = () => { showAddReferenceModal.value = true }

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

let lastSearchToolbarScrollY = 0
let stickyResizeObserver: ResizeObserver | undefined

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

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', saveCurrentReferencesState, { passive: true })
    lastSearchToolbarScrollY = window.scrollY
    isAtPageTop.value = window.scrollY <= 1
    window.addEventListener('scroll', handleSearchToolbarScroll, { passive: true })
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
    const hasExplicitFilterQuery = ['q', 'type', 'sort', 'order'].some(key => route.query[key] !== undefined)
    const snapshotMatchesRoute = snapshot && (
      snapshot.searchQuery === searchQuery.value &&
      snapshot.primaryType === primaryType.value &&
      snapshot.sortBy === sortBy.value &&
      snapshot.sortOrder === sortOrder.value
    )

    if (shouldRestore && snapshot && (!hasExplicitFilterQuery || snapshotMatchesRoute)) {
      await restoreReferencesState(snapshot)

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: snapshot.scrollY, behavior: 'auto' })
        lastSearchToolbarScrollY = snapshot.scrollY
        isAtPageTop.value = snapshot.scrollY <= 1
        searchToolbarVisible.value = snapshot.scrollY <= 80
      }

      referencesListStore.clearRestoreRequest()
      await syncReferencesFiltersToRoute()
    } else {
      if (shouldRestore) referencesListStore.clearRestoreRequest()
      await syncReferencesFiltersToRoute()
      if (searchQuery.value.trim()) {
        await performSearch(searchQuery.value)
      } else {
        await loadReferences()
      }
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

onBeforeRouteLeave((to) => {
  if (typeof window === 'undefined') return

  saveCurrentReferencesState()

  if (to.path.startsWith('/references/')) {
    referencesListStore.requestRestore()
  } else {
    referencesListStore.clearRestoreRequest()
  }
})

onUnmounted(() => {
  dismissEmptyLetterTooltip()
  stickyResizeObserver?.disconnect()
  stopReferencesLoadingFeedback()
  debouncedSearch.cancel()
  debouncedSyncReferencesFiltersToRoute.cancel()

  if (referencesResultsHeightTimer) {
    clearTimeout(referencesResultsHeightTimer)
    referencesResultsHeightTimer = undefined
  }
  if (referencesResultsHeightFrame !== undefined && typeof window !== 'undefined') {
    window.cancelAnimationFrame(referencesResultsHeightFrame)
    referencesResultsHeightFrame = undefined
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', saveCurrentReferencesState)
    window.removeEventListener('scroll', handleSearchToolbarScroll)
  }
})

watch([sortBy, primaryType], async () => {
  await nextTick()
  updateStickyMeasurements()
})

watch([sortBy, primaryType], () => {
  if (isRestoringState.value || isApplyingRouteFilters.value) return
  if (isProgrammaticReset.value) return

  if (searchQuery.value) {
    performSearch(searchQuery.value)
  } else {
    loadReferences()
  }
})

watch(searchQuery, (newQuery) => {
  if (isRestoringState.value || isApplyingRouteFilters.value) return
  if (isProgrammaticReset.value) return

  debouncedSearch()
})

watch([searchQuery, primaryType, sortBy, sortOrder], () => {
  if (isRestoringState.value || isApplyingRouteFilters.value) return
  debouncedSyncReferencesFiltersToRoute()
}, { flush: 'post' })

watch(() => route.query, async () => {
  const nextFilters = readReferencesFiltersFromRoute()
  const filtersChanged = nextFilters.searchQuery !== searchQuery.value ||
    nextFilters.primaryType !== primaryType.value ||
    nextFilters.sortBy !== sortBy.value ||
    nextFilters.sortOrder !== sortOrder.value

  if (!filtersChanged) {
    debouncedSyncReferencesFiltersToRoute()
    return
  }

  debouncedSyncReferencesFiltersToRoute.cancel()
  debouncedSearch.cancel()
  isApplyingRouteFilters.value = true
  searchQuery.value = nextFilters.searchQuery
  primaryType.value = nextFilters.primaryType
  sortBy.value = nextFilters.sortBy
  sortOrder.value = nextFilters.sortOrder
  await nextTick()
  isApplyingRouteFilters.value = false

  if (searchQuery.value.trim()) {
    await performSearch(searchQuery.value)
  } else {
    await loadReferences()
  }
}, { deep: true })
</script>

<style scoped>
.references-results-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  overflow: clip;
  transition: grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.references-results-shell > :first-child {
  min-width: 0;
  min-height: 0;
}

:deep(.references-list-enter-active) {
  transition: opacity 260ms ease, transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reference-entry-delay, 0ms);
}

:deep(.references-list-leave-active) {
  position: absolute;
  width: 100%;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
}

:deep(.references-list-move) {
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

:deep(.references-list-enter-from),
:deep(.references-list-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .references-results-shell {
    transition-duration: 1ms;
  }

  :deep(.references-list-enter-active),
  :deep(.references-list-leave-active),
  :deep(.references-list-move) {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }
}
</style>
