<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Favourites
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Your liked quotes and saved favourites.
      </p>
    </div>

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

    <!-- Add to Collection Modal -->
    <AddToCollectionModal
      v-if="selectedQuote"
      v-model="showAddToCollectionModal"
      :quote="selectedQuote"
      @added="handleAddedToCollection"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'

// Extended interface for liked quotes with additional fields
interface LikedQuote extends Omit<QuoteWithRelations, 'likes_count'> {
  liked_at: string
  likes_count?: number
  is_liked: boolean
}

// Use dashboard layout
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// SEO
useHead({
  title: 'Favourites - Dashboard - Verbatims'
})

// Data
const loading = ref(true)
const loadingMore = ref(false)
const quotes = ref<LikedQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const hasMore = ref(false)
const currentPage = ref(1)

// Modals
const showAddToCollectionModal = ref(false)
const selectedQuote = ref<LikedQuote | null>(null)

// Sort options
const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Author A-Z', value: 'author' }
]

// Computed
const filteredQuotes = computed(() => {
  let filtered = [...quotes.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote =>
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query)
    )
  }

  // Sort
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

// Methods
const loadFavourites = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/liked-quotes', {
      query: { page, limit: 20 }
    })

    if (page === 1) {
      quotes.value = response.data || []
    } else {
      quotes.value.push(...(response.data || []))
    }

    hasMore.value = response.pagination?.hasMore || false
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
  // Remove from favourites list when unliked
  if (!quote.is_liked) {
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  }
}

const handleAddToCollection = (quote: LikedQuote) => {
  selectedQuote.value = quote
  showAddToCollectionModal.value = true
}

const handleAddedToCollection = () => {
  // Could show a toast notification here
  showAddToCollectionModal.value = false
  selectedQuote.value = null
}

// Load data on mount
onMounted(() => {
  loadFavourites()
})

// Watch for search/sort changes
watch([searchQuery, sortBy], () => {
  // Debounce search
  if (searchQuery.value) {
    // For now, just filter client-side
    // In a real app, you might want to debounce and search server-side
  }
})
</script>
