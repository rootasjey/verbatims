<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        Tags
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400">
        Browse quote topics and discover the ideas that resonate most.
      </p>
    </header>

    <div class="max-w-6xl mx-auto px-8 pb-16">
      <TagSearch
        v-if="loading || tags.length > 0 || searchQuery"
        ref="searchInput"
        :tags-count="tags.length"
        :total-tags="totalTags"
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        :sort-order="sortOrder"
        :sort-options="sortOptions"
        v-model:mobile-filters-open="mobileFiltersOpen"
        @toggle-sort-order="toggleSortOrder"
        @change-sort="loadTags"
        @search-input="debouncedSearch"
      />

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
        <div v-for="i in 8" :key="i" class="border p-6 animate-pulse">
          <div class="border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 mb-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        </div>
      </div>

      <TagEmptyView
        v-else-if="tags.length === 0"
        :search-query="searchQuery"
        class="mt-24"
        @clear-filters="clearFilters"
        @create-tag="showCreateTag = true"
      />

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 mb-12">
          <TagGridItem
            v-for="tag in tags"
            :key="tag.id"
            :tag="tag"
            class="fade-in"
          />
        </div>
      </div>

      <div class="flex justify-center">
        <LoadMoreButton
          v-if="tags.length > 0 && hasMore"
          class="mb-4"
          idleText="Load More Tags"
          loadingText="Loading Tags..."
          :isLoading="loadingMore"
          @load="loadMore"
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

useHead({
  title: 'Tags - Verbatims',
  meta: [
    {
      name: 'description',
      content: 'Browse tags and explore quote topics across Verbatims.'
    }
  ]
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://verbatims.cc' },
    { '@type': 'ListItem', position: 2, name: 'Tags', item: 'https://verbatims.cc/tags' }
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

const searchQuery = ref<string>('')
const sortBy = ref<string>('name')
const sortOrder = ref<'ASC' | 'DESC'>('ASC')
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

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Recently Added', value: 'created_at' }
]

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
        limit: 24,
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

const debouncedSearch = useDebounceFn(() => {
  loadTags()
}, 300)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedSaveScrollState, { passive: true })
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
    if (shouldRestore && snapshot) {
      await restoreTagsState(snapshot)

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: snapshot.scrollY, behavior: 'auto' })
      }

      tagsListStore.clearRestoreRequest()
    } else {
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
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedSaveScrollState)
  }
})

watch([sortBy], () => {
  if (isRestoringState.value) return
  loadTags()
})

watch(searchQuery, (newQuery) => {
  if (isRestoringState.value) return
  if (!newQuery || newQuery.trim().length === 0) {
    loadTags()
  }
})
</script>

<style scoped>
</style>
