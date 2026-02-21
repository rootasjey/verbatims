<template>
  <div class="min-h-screen">
    <div v-if="pending" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">Loading tag...</span>
      </div>
    </div>

    <div v-else-if="tag">
      <header class="mt-12 p-8 text-center">
        <div class="flex items-center justify-center mb-4">
          <NBadge badge="soft" size="sm" :style="tagBadgeStyle">
            {{ tag.category || 'General' }}
          </NBadge>
        </div>

        <h1 class="font-title text-size-18 md:text-size-42 lg:text-size-54 font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4">
          #{{ tag.name }}
        </h1>

        <p v-if="tag.description" class="font-serif text-size-4 md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-4">
          {{ tag.description }}
        </p>

        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">
          {{ tag.usage_count || 0 }} {{ (tag.usage_count || 0) === 1 ? 'quote' : 'quotes' }} tagged
        </p>
      </header>

      <div class="px-8 pb-16">
        <div class="font-body mb-8">
          <div class="hidden md:flex gap-4 max-w-2xl mx-auto items-center justify-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ quotes.length }} quotes</p>
            <span>•</span>
            <span class="whitespace-nowrap font-600 text-gray-600 dark:text-gray-500">sorted by</span>
            <NSelect
              v-model="sortByModel"
              :items="sortOptions"
              placeholder="Sort by"
              item-key="label"
              value-key="label"
              @change="loadQuotes"
            />
            <LanguageSelector :on-language-changed="onLanguageChange" />
            <NButton
              icon
              :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
              btn="soft-gray"
              @click="toggleSortOrder"
            />
          </div>

          <div class="md:hidden flex items-center justify-between max-w-xl mx-auto">
            <p class="font-600 text-gray-600 dark:text-gray-300">{{ quotes.length }} quotes</p>
            <NButton size="sm" btn="outline-gray" class="rounded-full" @click="mobileFiltersOpen = true">
              <NIcon name="i-ph-faders" class="w-4 h-4 mr-1" />
              Sort
            </NButton>
          </div>
        </div>

        <div v-if="quotesLoading" class="mb-12">
          <MasonryGrid>
            <div v-for="i in 12" :key="i" class="quote-skeleton animate-pulse">
              <div class="border-b border-dashed border-gray-200 dark:border-gray-400 pb-2 mb-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
          </MasonryGrid>
        </div>

        <div v-else-if="quotes.length > 0" class="mb-12">
          <div class="hidden md:block">
            <MasonryGrid>
              <QuoteMasonryItem
                v-for="(quote, index) in quotes"
                :key="quote.id"
                :quote="quote"
                :index="index"
                class="fade-in"
              />
            </MasonryGrid>
          </div>

          <div class="md:hidden space-y-4">
            <QuoteListItem
              v-for="quote in quotes"
              :key="quote.id"
              :quote="{
                ...quote,
                result_type: 'quote',
                author: {
                  id: quote.author?.id ?? 0,
                  name: quote.author?.name ?? '',
                  image_url: quote.author?.image_url ?? '',
                  is_fictional: quote.author?.is_fictional ?? false
                },
                reference: {
                  id: quote.reference?.id ?? 0,
                  name: quote.reference?.name ?? '',
                  type: quote.reference?.primary_type ?? '',
                }
              }"
              class="border rounded-1 border-gray-100 dark:border-dark-400"
            />
          </div>
        </div>

        <div v-else class="text-center py-16">
          <NIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400">
            No approved quotes are currently tagged with #{{ tag.name }}.
          </p>
        </div>

        <div v-if="hasMoreQuotes && !quotesLoading" class="flex justify-center">
          <LoadMoreButton
            class="mb-4"
            idleText="Load More Quotes"
            loadingText="Loading Quotes..."
            :isLoading="loadingMoreQuotes"
            @load="loadMoreQuotes"
          />
        </div>
      </div>
    </div>

    <div v-else class="p-8">
      <div class="text-center py-16">
        <NIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Tag Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The tag you're looking for doesn't exist or has been removed.
        </p>
        <NButton to="/tags" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse Tags
        </NButton>
      </div>
    </div>

    <ClientOnly>
      <MobileSortAuthors
        v-if="isMobile"
        v-model:open="mobileFiltersOpen"
        v-model:sortBy="sortBy"
        :sort-order="sortOrder"
        :sort-options="sortOptions"
        @toggle-sort-order="toggleSortOrder"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({ layout: 'default' })

const route = useRoute()
const rawTagName = computed(() => String(route.params.name || ''))
const languageStore = useLanguageStore()

const sortBy = ref<string>('created_at')
const sortOrder = ref<'ASC' | 'DESC'>('DESC')
const quotes = ref<any[]>([])
const quotesLoading = ref<boolean>(true)
const loadingMoreQuotes = ref<boolean>(false)
const hasMoreQuotes = ref<boolean>(false)
const currentPage = ref<number>(1)
const mobileFiltersOpen = ref<boolean>(false)

const sortOptions = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Most Liked', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' },
  { label: 'Most Shared', value: 'shares_count' }
]

const sortByModel = computed({
  get: () => sortOptions.find(option => option.value === sortBy.value) || sortOptions[0],
  set: (option: { label: string; value: string } | null) => {
    sortBy.value = option?.value || 'created_at'
  }
})

const { data: tagData, pending } = await useLazyFetch<ApiResponse<TagWithStats>>(
  `/api/tags/${encodeURIComponent(rawTagName.value)}`,
  {
    watch: [rawTagName]
  }
)

const tag = computed(() => tagData.value?.data ?? null)

const tagBadgeStyle = computed(() => {
  const color = tag.value?.color?.trim()
  if (!color) return undefined
  return {
    borderColor: `${color}66`
  }
})

const loadQuotes = async (reset = true) => {
  if (!tag.value?.name) return

  if (reset) {
    quotesLoading.value = true
    currentPage.value = 1
    quotes.value = []
  } else {
    loadingMoreQuotes.value = true
  }

  try {
    const response: any = await $fetch('/api/quotes', {
      query: {
        page: currentPage.value,
        limit: 20,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        tag: tag.value.name,
        ...languageStore.getLanguageQuery()
      }
    })

    const fetchedQuotes = response?.data || []

    if (reset) {
      quotes.value = fetchedQuotes
    } else {
      quotes.value.push(...fetchedQuotes)
    }

    hasMoreQuotes.value = Boolean(response?.pagination?.hasMore)
  } catch (error) {
    console.error('Failed to load tag quotes:', error)
  } finally {
    quotesLoading.value = false
    loadingMoreQuotes.value = false
  }
}

const loadMoreQuotes = async () => {
  if (!hasMoreQuotes.value || loadingMoreQuotes.value) return
  currentPage.value += 1
  await loadQuotes(false)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  loadQuotes()
}

const onLanguageChange = async () => {
  currentPage.value = 1
  hasMoreQuotes.value = true
  await loadQuotes(true)
}

watch(tag, (value) => {
  if (value?.name) {
    useHead({
      title: `#${value.name} - Verbatims`,
      meta: [
        {
          name: 'description',
          content: value.description || `Browse quotes tagged with ${value.name} on Verbatims.`
        }
      ]
    })

    loadQuotes()
  }
}, { immediate: true })

watch(sortBy, () => {
  if (tag.value?.name) loadQuotes()
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

onMounted(() => {
  setPageLayout(currentLayout.value)
})
</script>

<style scoped>
.quote-skeleton {
  border: 1px solid var(--ui-border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1.25rem;
}
</style>
