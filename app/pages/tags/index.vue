<template>
  <div class="min-h-screen">
    <header class="mt-12 md:mt-0 p-8">
      <h1 class="font-title hyphens-auto overflow-hidden break-words font-600 text-center line-height-none uppercase">
        Tags
      </h1>
      <p class="font-serif text-size-3 md:text-lg text-center text-gray-600 dark:text-gray-400">
        Browse quote topics and discover the ideas that resonate most.
      </p>
    </header>

    <div class="px-8 pb-16">
      <TagSearch
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

      <div v-else-if="tags.length === 0" class="text-center mt-24">
        <NIcon name="i-ph-tag" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No tags found</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'No tags are available yet.' }}
        </p>
        <NButton v-if="searchQuery" btn="outline-gray" @click="clearFilters">Clear search</NButton>
      </div>

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
  </div>
</template>

<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false
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
const loading = ref<boolean>(true)
const loadingMore = ref<boolean>(false)
const hasMore = ref<boolean>(true)
const currentPage = ref<number>(1)
const totalTags = ref<number>(0)
const searchInput = ref<any>(null)
const mobileFiltersOpen = ref(false)

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Quote Count', value: 'quotes_count' },
  { label: 'Recently Added', value: 'created_at' }
]

useFocusOnTyping(searchInput, {
  skipOnMobile: true,
  fallbackSelector: 'input[placeholder="Search tags..."]'
})

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
    } else {
      tags.value.push(...tagsData)
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
  setPageLayout(currentLayout.value)
  loadTags()
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

watch([sortBy], () => {
  loadTags()
})

watch(searchQuery, (newQuery) => {
  if (!newQuery || newQuery.trim().length === 0) {
    loadTags()
  }
})
</script>

<style scoped>
header h1 {
  font-size: 4.0rem;
  transition: font-size 0.3s ease;

  @media (min-width: 480px)   { font-size: 8.0rem;  }
  @media (min-width: 768px)   { font-size: 10.0rem; }
  @media (min-width: 812px)   { font-size: 12.0rem; }
  @media (min-width: 912px)   { font-size: 13.5rem; }
  @media (min-width: 1024px)  { font-size: 15.0rem; }
  @media (min-width: 1124px)  { font-size: 18.0rem; }
  @media (min-width: 1224px)  { font-size: 20.5rem; }
}
</style>
