<template>
  <div class="min-h-screen">
    <!-- Mobile: Favourites List -->
    <div v-if="isMobile" class="mobile-favourites-page">
      <!-- Header & Controls -->
      <div class="p-4 pt-6">
        <div class="text-center mb-4">
          <h1 class="text-2xl font-600 text-gray-900 dark:text-white">Favourites</h1>
          <p class="text-gray-600 dark:text-gray-400">Your liked quotes</p>
        </div>

        <div class="flex gap-3">
          <UInput
            v-model="searchQuery"
            placeholder="Search your favourites..."
            leading="i-ph-magnifying-glass"
            size="md"
            class="flex-1"
          />
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Sort"
            size="sm"
            item-key="label"
            value-key="label"
            class="w-40"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredQuotes.length === 0" class="text-center py-16 px-4">
        <UIcon name="i-ph-heart" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching favourites' : 'No favourites yet' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Start exploring quotes and like the ones you love.' }}
        </p>
        <UButton v-if="!searchQuery" btn="solid-black" to="/">
          <UIcon name="i-ph-magnifying-glass" />
          Discover Quotes
        </UButton>
      </div>

      <!-- Results -->
      <div v-else class="px-0 pb-6">
        <div class="px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'favourite' : 'favourites' }}
        </div>

        <div class="divide-y divide-dashed divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          <QuoteListItem
            v-for="quote in processedMobileQuotes"
            :key="quote.id"
            :quote="quote"
          />
        </div>

        <div v-if="hasMore" class="px-4 pt-6">
          <UButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </UButton>
        </div>
      </div>
    </div>

    <!-- Desktop: Masonry Grid -->
    <div v-else>
      <!-- Search and Filters -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search your favourites..."
            leading="i-ph-magnifying-glass"
            size="md"
          />
        </div>
        <div class="w-full sm:w-48">
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            placeholder="Sort by"
            size="sm"
            item-key="label"
            value-key="label"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQuotes.length === 0 && !loading" class="text-center py-16">
        <UIcon name="i-ph-heart" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching favourites' : 'No favourites yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Start exploring quotes and like the ones you love.' }}
        </p>
        <UButton v-if="!searchQuery" btn="solid-black" to="/">
          <UIcon name="i-ph-magnifying-glass" />
          Discover Quotes
        </UButton>
      </div>

      <!-- Quotes Grid -->
      <div v-else class="space-y-6">
        <!-- Results Count -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'favourite' : 'favourites' }}
        </div>

        <!-- Masonry Grid -->
        <MasonryGrid>
          <QuoteMasonryItem
            v-for="quote in filteredQuotes"
            :key="quote.id"
            :quote="quote"
            :show-actions="true"
            @like-toggled="handleLikeToggled"
            @add-to-collection="handleAddToCollection"
          />
        </MasonryGrid>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center pt-8">
          <UButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </UButton>
        </div>
      </div>
    </div>

    <!-- Add to Collection Modal (desktop only for now) -->
    <AddToCollectionModal
      v-if="selectedQuote"
      v-model="showAddToCollectionModal"
      :quote="selectedQuote"
      @added="handleAddedToCollection"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~/types'
import type { QuoteWithRelations } from '~/types/quote'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

interface LikedQuote extends Omit<QuoteWithRelations, 'likes_count'> {
  liked_at: string
  likes_count: number
  is_liked: boolean
  author_name?: string
  author_is_fictional?: boolean
  author_image_url?: string
  reference_name?: string
  reference_type?: string
  tags?: Array<{ name: string; color: string }>
}

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Favourites - Dashboard - Verbatims'
})

const loading = ref(true)
const loadingMore = ref(false)
const quotes = ref<LikedQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const hasMore = ref(false)
const currentPage = ref(1)

const showAddToCollectionModal = ref(false)
const selectedQuote = ref<LikedQuote | null>(null)

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Author A-Z', value: 'author' }
]

const filteredQuotes = computed(() => {
  let filtered = [...quotes.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote =>
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query)
    )
  }

  switch (sortBy.value.value) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.liked_at).getTime() - new Date(b.liked_at).getTime())
      break
    case 'popular':
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      break
    case 'author':
      filtered.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default: // recent
      filtered.sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime())
  }

  return filtered
})

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return filteredQuotes.value.map((q) => ({
    ...q,
    result_type: 'quote',
    author_name: q.author_name ?? q.author?.name,
    author_is_fictional: q.author_is_fictional ?? (q.author as any)?.is_fictional,
    author_image_url: q.author_image_url ?? (q.author as any)?.image_url,
    reference_name: q.reference_name ?? q.reference?.name,
    reference_type: q.reference_type ?? (q.reference as any)?.type,
    tags: q.tags ?? [],
    author: q.author || (q.author_name ? { id: q.author_id!, name: q.author_name, is_fictional: q.author_is_fictional, image_url: q.author_image_url } as any : undefined),
    reference: q.reference || (q.reference_name ? { id: q.reference_id!, name: q.reference_name, type: q.reference_type } as any : undefined),
  }))
})

const loadFavourites = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/liked-quotes', {
      query: { page, limit: 20 }
    })

    const data = (response as any)?.data || []
    if (page === 1) {
      quotes.value = data
    } else {
      quotes.value.push(...data)
    }

    hasMore.value = (response as any)?.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load favourites:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  await loadFavourites(currentPage.value + 1)
}

const handleLikeToggled = (quote: LikedQuote) => {
  if (!quote.is_liked) {
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  }
}

const handleAddToCollection = (quote: LikedQuote) => {
  selectedQuote.value = quote
  showAddToCollectionModal.value = true
}

const handleAddedToCollection = () => {
  showAddToCollectionModal.value = false
  selectedQuote.value = null
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadFavourites()
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

watch([searchQuery, sortBy], () => {
  if (searchQuery.value) {
    // For now, just filter client-side
    // In a real app, you might want to debounce and search server-side
  }
})
</script>

<style scoped>
.mobile-favourites-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
}
</style>
