<template>
  <div class="min-h-screen">
    <header class="mx-auto max-w-6xl px-6 pb-8 pt-12 sm:px-8 md:pb-16 md:pt-28 lg:px-10">
      <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
        {{ $t('tags_title') }}
      </h1>
      <p class="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:mt-5 md:text-xl">
        {{ $t('tags_subtitle') }}
      </p>
    </header>

    <main class="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
      <div
        v-if="loading || tags.length > 0 || searchQuery"
        ref="searchToolbar"
        class="sticky top-14 z-20 mb-5 bg-[#FAFAF9]/95 pt-2 backdrop-blur-md transition-transform duration-300 ease-out dark:bg-[#0C0A09]/95 md:mb-8 md:pt-3"
        :class="searchToolbarVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)] pointer-events-none'"
      >
        <TagSearch
          ref="searchInput"
          :tags-count="tags.length"
          :total-tags="totalTags"
          :show-result-count="!loading"
          :has-active-filters="hasActiveFilters"
          v-model:search-query="searchQuery"
          v-model:sort-by="sortBy"
          :sort-order="sortOrder"
          :sort-options="sortOptions"
          v-model:mobile-filters-open="mobileFiltersOpen"
          @toggle-sort-order="toggleSortOrder"
          @search-input="debouncedSearch"
        />
      </div>

      <section
        v-if="loading || tags.length > 0 || searchQuery"
        aria-labelledby="tags-directory-title"
        class="mt-8 rounded-2xl bg-[#e7e4dd] px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10 dark:bg-[#17191e]"
      >
        <h2 id="tags-directory-title" class="sr-only">{{ $t('tags_title') }}</h2>

        <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4" aria-busy="true">
          <div v-for="i in 8" :key="i" class="min-h-52 animate-pulse rounded-xl border border-black/6 bg-white/35 p-5 dark:border-white/8 dark:bg-white/3">
            <div class="mb-5 flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-black/10 dark:bg-white/10" />
              <div class="h-3 w-20 rounded bg-black/10 dark:bg-white/10" />
            </div>
            <div class="mb-3 h-7 w-3/4 rounded bg-black/10 dark:bg-white/10" />
            <div class="space-y-2">
              <div class="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
              <div class="h-3 w-4/5 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        </div>

        <TagEmptyView
          v-else-if="tags.length === 0"
          :search-query="searchQuery"
          @clear-filters="clearFilters"
          @create-tag="showCreateTag = true"
        />

        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
          <TagGridItem
            v-for="tag in tags"
            :key="tag.id"
            :tag="tag"
          />
        </div>
      </section>

      <div v-if="tags.length > 0 && hasMore" class="mt-8 flex justify-center">
        <LoadMoreButton
          :idleText="$ts('tags_load_more')"
          :loadingText="$ts('tags_loading')"
          :isLoading="loadingMore"
          @load="loadMore"
        />
      </div>
    </main>

    <MobileSortAuthors
      v-if="isMobile"
      v-model:open="mobileFiltersOpen"
      v-model:sortBy="sortBy"
      :sort-order="sortOrder"
      :sort-options="sortOptions"
      :title="$ts('tags_mobile_sort_title')"
      :has-active-filters="hasActiveFilters"
      :reset-label="$ts('tags_reset_filters')"
      @toggle-sort-order="toggleSortOrder"
      @reset-filters="resetFilters"
    />

    <ClientOnly>
      <AddTagDialog v-model="showCreateTag" @tag-added="showCreateTag = false; loadTags()" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core'
import { useJsonLd } from '~/composables/useSeo'
import { useTagsListStore } from '~/stores/tags'
import type { TagsListSnapshot } from '~/stores/tags'

const { isMobile } = useMobileDetection()
const tagsListStore = useTagsListStore()

definePageMeta({
  layout: 'default'
})

const { $t, $ts } = useI18n()
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

const tagSortValues = new Set(['name', 'quotes_count', 'created_at'])
const readQueryString = (value: unknown) => typeof value === 'string' ? value : ''
const readTagsFiltersFromRoute = () => {
  const routeSearchQuery = readQueryString(route.query.q)
  const routeSortBy = readQueryString(route.query.sort)

  return {
    searchQuery: routeSearchQuery.trim() ? routeSearchQuery : '',
    sortBy: tagSortValues.has(routeSortBy) ? routeSortBy : 'name',
    sortOrder: route.query.order === 'DESC' ? 'DESC' as const : 'ASC' as const
  }
}
const initialTagsFilters = readTagsFiltersFromRoute()

useHead({
  title: $ts('tags_meta_title'),
  meta: [
    {
      name: 'description',
      content: $ts('tags_meta_desc'),
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: $t('tags_breadcrumb_home'), item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: $t('tags_breadcrumb'), item: 'https://verbatims.cc/tags' }
  ]
})

interface TagListItem {
  id: number
  name: string
  description?: string | null
  category?: string | null
  color?: string | null
  created_at?: string
  quotes_count?: number
}

const searchQuery = ref<string>(initialTagsFilters.searchQuery)
const sortBy = ref<string>(initialTagsFilters.sortBy)
const sortOrder = ref<'ASC' | 'DESC'>(initialTagsFilters.sortOrder)
const tags = ref<TagListItem[]>([])
const allFetchedTags = ref<TagListItem[]>([])
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const totalTags = ref<number>(0)
const searchInput = ref<any>(null)
const mobileFiltersOpen = ref(false)
const showCreateTag = ref(false)
const isRestoringState = ref(false)
const isResettingFilters = ref(false)
const isApplyingRouteFilters = ref(false)
const searchToolbar = ref<HTMLElement | null>(null)
const searchToolbarVisible = ref(true)

const hasActiveFilters = computed(() => (
  searchQuery.value.trim().length > 0 || sortBy.value !== 'name' || sortOrder.value !== 'ASC'
))

let lastSearchToolbarScrollY = 0

const sortOptions = [
  { label: $ts('tags_sort_name'), value: 'name' },
  { label: $ts('tags_sort_quote_count'), value: 'quotes_count' },
  { label: $ts('tags_sort_recent'), value: 'created_at' }
]

const syncTagsFiltersToRoute = async () => {
  if (isRestoringState.value || isApplyingRouteFilters.value) return

  const query = { ...route.query }
  delete query.q
  delete query.sort
  delete query.order

  if (searchQuery.value.trim()) query.q = searchQuery.value
  if (sortBy.value !== 'name') query.sort = sortBy.value
  if (sortOrder.value !== 'ASC') query.order = sortOrder.value

  const filterKeys = ['q', 'sort', 'order'] as const
  if (filterKeys.every(key => route.query[key] === query[key])) return

  await router.replace({ path: route.path, query, hash: route.hash })
}
const debouncedSyncTagsFiltersToRoute = createDebouncedAction(syncTagsFiltersToRoute, 250)

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder*="Search"]'
})

const saveCurrentTagsState = () => {
  tagsListStore.saveSnapshot({
    tags: tags.value,
    allFetchedTags: allFetchedTags.value,
    currentPage: currentPage.value,
    hasMore: hasMore.value,
    totalTags: totalTags.value,
    searchQuery: searchQuery.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0
  })
}

const debouncedSaveScrollState = useDebounceFn(() => {
  if (isRestoringState.value) return
  saveCurrentTagsState()
}, 100)

const restoreTagsState = async (snapshot: TagsListSnapshot) => {
  isRestoringState.value = true

  searchQuery.value = snapshot.searchQuery
  sortBy.value = snapshot.sortBy
  sortOrder.value = snapshot.sortOrder
  tags.value = [...snapshot.tags]
  allFetchedTags.value = [...snapshot.allFetchedTags]
  currentPage.value = snapshot.currentPage
  hasMore.value = snapshot.hasMore
  totalTags.value = snapshot.totalTags
  loading.value = false
  loadingMore.value = false

  await nextTick()
  isRestoringState.value = false
}

const loadTags = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    tags.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response = await $fetch('/api/tags', {
      query: {
        page: currentPage.value,
        limit: 48,
        search: searchQuery.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }
    })

    const tagsData = (response as any)?.data || []

    if (reset) {
      tags.value = tagsData
      allFetchedTags.value = [...tagsData]
    } else {
      tags.value.push(...tagsData)
      allFetchedTags.value.push(...tagsData)
    }

    hasMore.value = Boolean((response as any)?.pagination?.hasMore)
    totalTags.value = Number((response as any)?.pagination?.total || 0)
  } catch (error) {
    console.error('Failed to load tags:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadTags(false)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadTags()
}

const clearFilters = async () => {
  searchQuery.value = ''
  await loadTags()
}

const resetFilters = async () => {
  debouncedSearch.cancel()
  isResettingFilters.value = true
  searchQuery.value = ''
  sortBy.value = 'name'
  sortOrder.value = 'ASC'
  await nextTick()
  isResettingFilters.value = false
  await loadTags()
}

const handleSearchToolbarScroll = () => {
  if (typeof window === 'undefined') return

  const currentScrollY = window.scrollY
  const scrollDelta = currentScrollY - lastSearchToolbarScrollY
  const searchHasFocus = searchToolbar.value?.contains(document.activeElement)

  if (currentScrollY <= 80 || scrollDelta < -4 || searchHasFocus || mobileFiltersOpen.value) {
    searchToolbarVisible.value = true
  } else if (scrollDelta > 4) {
    searchToolbarVisible.value = false
  }

  lastSearchToolbarScrollY = currentScrollY
}

const debouncedSearch = createDebouncedAction(() => {
  loadTags()
}, 300)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedSaveScrollState, { passive: true })
    lastSearchToolbarScrollY = window.scrollY
    window.addEventListener('scroll', handleSearchToolbarScroll, { passive: true })
  }

  const shouldRestore = tagsListStore.shouldRestore
  const storedSnapshot = tagsListStore.snapshot
  const snapshot = storedSnapshot
    ? {
        ...storedSnapshot,
        tags: [...storedSnapshot.tags],
        allFetchedTags: [...storedSnapshot.allFetchedTags]
      }
    : null

  const initializePage = async () => {
    const hasExplicitFilterQuery = ['q', 'sort', 'order'].some(key => route.query[key] !== undefined)
    const snapshotMatchesRoute = snapshot && (
      snapshot.searchQuery === searchQuery.value &&
      snapshot.sortBy === sortBy.value &&
      snapshot.sortOrder === sortOrder.value
    )

    if (shouldRestore && snapshot && (!hasExplicitFilterQuery || snapshotMatchesRoute)) {
      await restoreTagsState(snapshot)

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: snapshot.scrollY, behavior: 'auto' })
        lastSearchToolbarScrollY = snapshot.scrollY
        searchToolbarVisible.value = snapshot.scrollY <= 80
      }

      tagsListStore.clearRestoreRequest()
      await syncTagsFiltersToRoute()
    } else {
      if (shouldRestore) tagsListStore.clearRestoreRequest()
      await syncTagsFiltersToRoute()
      await loadTags()
    }

    await nextTick()
  }

  void initializePage()
})

onBeforeRouteLeave((to) => {
  if (typeof window === 'undefined') return

  saveCurrentTagsState()

  if (to.path.startsWith('/tags/')) {
    tagsListStore.requestRestore()
  } else {
    tagsListStore.clearRestoreRequest()
  }
})

onUnmounted(() => {
  debouncedSearch.cancel()
  debouncedSyncTagsFiltersToRoute.cancel()

  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedSaveScrollState)
    window.removeEventListener('scroll', handleSearchToolbarScroll)
  }
})

watch([sortBy], () => {
  if (isRestoringState.value || isResettingFilters.value || isApplyingRouteFilters.value) return
  loadTags()
})

watch(searchQuery, (newQuery) => {
  if (isRestoringState.value || isResettingFilters.value || isApplyingRouteFilters.value) return
  if (!newQuery || newQuery.trim().length === 0) {
    loadTags()
  }
})

watch([searchQuery, sortBy, sortOrder], () => {
  if (isRestoringState.value || isApplyingRouteFilters.value) return
  debouncedSyncTagsFiltersToRoute()
}, { flush: 'post' })

watch(() => route.query, async () => {
  const nextFilters = readTagsFiltersFromRoute()
  const filtersChanged = nextFilters.searchQuery !== searchQuery.value ||
    nextFilters.sortBy !== sortBy.value ||
    nextFilters.sortOrder !== sortOrder.value

  if (!filtersChanged) {
    debouncedSyncTagsFiltersToRoute()
    return
  }

  debouncedSyncTagsFiltersToRoute.cancel()
  debouncedSearch.cancel()
  isApplyingRouteFilters.value = true
  searchQuery.value = nextFilters.searchQuery
  sortBy.value = nextFilters.sortBy
  sortOrder.value = nextFilters.sortOrder
  await nextTick()
  isApplyingRouteFilters.value = false
  await loadTags()
}, { deep: true })
</script>

<style scoped>
</style>
